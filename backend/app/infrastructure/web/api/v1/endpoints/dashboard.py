"""Dashboard endpoints."""
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, cast, Date, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.problem_dto import ProblemResponseDTO
from app.application.dto.idea_dto import IdeaResponseDTO
from app.application.dto.user_dto import UserResponseDTO
from app.application.services.response_enrichment import enrich_problems, enrich_ideas
from app.infrastructure.database.models.problem_model import ProblemModel
from app.infrastructure.database.models.idea_model import IdeaModel
from app.infrastructure.database.models.comment_model import CommentModel
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository
from app.infrastructure.database.repositories.idea_repository_impl import SQLIdeaRepository
from app.infrastructure.database.repositories.comment_repository_impl import SQLCommentRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.database.repositories.room_repository_impl import SQLRoomRepository
from app.infrastructure.database.repositories.reaction_repository_impl import SQLReactionRepository
from app.infrastructure.database.repositories.vote_repository_impl import SQLVoteRepository
from app.infrastructure.security.jwt import get_current_active_user
from app.infrastructure.web.api import deps

router = APIRouter()


def _build_date_filter(date_from: Optional[date], date_to: Optional[date]) -> dict:
    """Build filter dict from optional date_from/date_to."""
    f: dict = {}
    if date_from:
        f["created_after"] = datetime.combine(date_from, datetime.min.time())
    if date_to:
        # date_to is inclusive, so filter < next day
        f["created_before"] = datetime.combine(date_to + timedelta(days=1), datetime.min.time())
    return f


class DashboardStats(BaseModel):
    total_problems: int
    total_ideas: int
    total_comments: int
    total_rooms: int
    interaction_rate: float
    resolved_problems: int
    problems_by_status: Dict[str, int]
    ideas_by_status: Dict[str, int]


class ContributorDTO(BaseModel):
    user: UserResponseDTO
    problems_count: int
    ideas_count: int


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    date_from: Optional[date] = Query(None, description="Start date (inclusive), e.g. 2026-01-01"),
    date_to: Optional[date] = Query(None, description="End date (inclusive), e.g. 2026-03-31"),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
):
    """Get dashboard statistics. Available to all authenticated users."""
    base_filter = _build_date_filter(date_from, date_to)
    is_admin = current_user.role == "admin"
    # Add privacy context so stats reflect visible items only
    privacy_filter = {**base_filter, "current_user_id": current_user.id, "is_admin": is_admin}

    # Get problems and ideas the user can see
    problems, total_problems = await problem_repo.list(privacy_filter, page=1, limit=10000)
    ideas_all, total_ideas = await idea_repo.list(privacy_filter, page=1, limit=10000)
    _, total_rooms = await room_repo.list(privacy_filter, page=1, limit=1)

    # Count comments on problems and ideas in the period
    total_comments = 0
    items_with_comments = 0
    for p in problems:
        _, count = await comment_repo.list_by_target(p.id, "problem", page=1, limit=1)
        total_comments += count
        if count > 0:
            items_with_comments += 1
    for i in ideas_all:
        _, count = await comment_repo.list_by_target(i.id, "idea", page=1, limit=1)
        total_comments += count
        if count > 0:
            items_with_comments += 1

    # Resolved problems (status = solved or closed) within period
    solved_filter = {**privacy_filter, "status": "solved"}
    closed_filter = {**privacy_filter, "status": "closed"}
    _, resolved_solved = await problem_repo.list(solved_filter, page=1, limit=1)
    _, resolved_closed = await problem_repo.list(closed_filter, page=1, limit=1)
    resolved_problems = resolved_solved + resolved_closed

    # Interaction rate: % of problems/ideas that have at least 1 comment
    total_items = len(problems) + len(ideas_all)
    interaction_rate = (items_with_comments / total_items * 100) if total_items > 0 else 0.0

    # Problems by status
    problems_by_status = {"open": 0, "discussing": 0, "brainstorming": 0, "solved": 0, "closed": 0}
    for p in problems:
        s = p.status.value if hasattr(p.status, "value") else str(p.status)
        if s in problems_by_status:
            problems_by_status[s] += 1

    # Ideas by status
    ideas_by_status = {"draft": 0, "refining": 0, "reviewing": 0, "submitted": 0, "closed": 0}
    for i in ideas_all:
        s = i.status.value if hasattr(i.status, "value") else str(i.status)
        if s in ideas_by_status:
            ideas_by_status[s] += 1

    return DashboardStats(
        total_problems=len(problems),
        total_ideas=len(ideas_all),
        total_comments=total_comments,
        total_rooms=total_rooms,
        interaction_rate=round(interaction_rate, 1),
        resolved_problems=resolved_problems,
        problems_by_status=problems_by_status,
        ideas_by_status=ideas_by_status,
    )


@router.get("/top-contributors", response_model=List[ContributorDTO])
async def get_top_contributors(
    limit: int = Query(10, ge=1, le=50),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
):
    """Get top contributors ranked by activity."""
    base_filter = _build_date_filter(date_from, date_to)
    is_admin = current_user.role == "admin"

    users, _ = await user_repo.list({}, page=1, limit=100)

    contributors = []
    for user in users:
        user_filter = {**base_filter, "author_id": user.id, "current_user_id": current_user.id, "is_admin": is_admin}
        _, problems_count = await problem_repo.list(user_filter, page=1, limit=1)
        _, ideas_count = await idea_repo.list(user_filter, page=1, limit=1)

        if problems_count > 0 or ideas_count > 0:
            contributors.append(
                ContributorDTO(
                    user=UserResponseDTO.model_validate(user),
                    problems_count=problems_count,
                    ideas_count=ideas_count,
                )
            )

    contributors.sort(
        key=lambda c: (c.problems_count * 2 + c.ideas_count, c.problems_count),
        reverse=True,
    )
    return contributors[:limit]


@router.get("/recent-problems", response_model=List[ProblemResponseDTO])
async def get_recent_problems(
    limit: int = Query(5, ge=1, le=20),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
):
    """Get most recent problems with enriched data."""
    is_admin = current_user.role == "admin"
    filter_dict = {"current_user_id": current_user.id, "is_admin": is_admin}
    problems, _ = await problem_repo.list(filter_dict, page=1, limit=limit)
    return await enrich_problems(
        problems, user_repo, reaction_repo, comment_repo, current_user.id, room_repo
    )


@router.get("/recent-ideas", response_model=List[IdeaResponseDTO])
async def get_recent_ideas(
    limit: int = Query(5, ge=1, le=20),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
):
    """Get most recent ideas with enriched data."""
    is_admin = current_user.role == "admin"
    filter_dict = {"current_user_id": current_user.id, "is_admin": is_admin}
    ideas, _ = await idea_repo.list(filter_dict, page=1, limit=limit)
    return await enrich_ideas(
        ideas, user_repo, reaction_repo, comment_repo, vote_repo, current_user.id
    )


class DailyActivity(BaseModel):
    date: str
    day_name: str
    problems: int
    ideas: int
    comments: int


class ActivityActorDTO(BaseModel):
    id: str
    username: str
    full_name: str | None
    avatar_url: str | None


class ActivityItem(BaseModel):
    id: str
    type: str
    actor: ActivityActorDTO
    target_title: str
    target_id: str
    created_at: str


@router.get("/problems-by-category", response_model=Dict[str, int])
async def get_problems_by_category(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
):
    """Get problem counts grouped by category."""
    base_filter = _build_date_filter(date_from, date_to)
    is_admin = current_user.role == "admin"
    privacy_filter = {**base_filter, "current_user_id": current_user.id, "is_admin": is_admin}
    problems, _ = await problem_repo.list(privacy_filter, page=1, limit=10000)

    categories = {"process": 0, "technical": 0, "people": 0, "tools": 0, "patent": 0}
    for p in problems:
        cat = p.category.value if hasattr(p.category, "value") else str(p.category)
        if cat in categories:
            categories[cat] += 1
    return categories


@router.get("/activity-over-time", response_model=List[DailyActivity])
async def get_activity_over_time(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session: AsyncSession = Depends(deps.get_db_session),
):
    """Get daily activity counts for problems, ideas, and comments."""
    end = date_to or date.today()
    start = date_from or (end - timedelta(days=6))

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    result: List[DailyActivity] = []
    current = start
    while current <= end:
        day_start = datetime.combine(current, datetime.min.time(), tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)

        p_count = (await session.execute(
            select(func.count()).select_from(ProblemModel).where(
                ProblemModel.created_at >= day_start,
                ProblemModel.created_at < day_end,
            )
        )).scalar() or 0

        i_count = (await session.execute(
            select(func.count()).select_from(IdeaModel).where(
                IdeaModel.created_at >= day_start,
                IdeaModel.created_at < day_end,
            )
        )).scalar() or 0

        c_count = (await session.execute(
            select(func.count()).select_from(CommentModel).where(
                CommentModel.created_at >= day_start,
                CommentModel.created_at < day_end,
            )
        )).scalar() or 0

        result.append(DailyActivity(
            date=current.isoformat(),
            day_name=day_names[current.weekday()],
            problems=p_count,
            ideas=i_count,
            comments=c_count,
        ))
        current += timedelta(days=1)

    return result


@router.get("/recent-activity", response_model=List[ActivityItem])
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=50),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session: AsyncSession = Depends(deps.get_db_session),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Get recent global activity feed. Admin-only."""
    if current_user.role != "admin":
        return []

    # Fetch recent problems
    p_rows = (await session.execute(
        select(ProblemModel).order_by(ProblemModel.created_at.desc()).limit(20)
    )).scalars().all()

    # Fetch recent ideas
    i_rows = (await session.execute(
        select(IdeaModel).order_by(IdeaModel.created_at.desc()).limit(20)
    )).scalars().all()

    # Fetch recent comments with target info
    c_rows = (await session.execute(
        select(CommentModel).order_by(CommentModel.created_at.desc()).limit(20)
    )).scalars().all()

    # Collect all author IDs for batch user lookup
    author_ids = set()
    for row in p_rows:
        author_ids.add(row.author_id)
    for row in i_rows:
        author_ids.add(row.author_id)
    for row in c_rows:
        author_ids.add(row.author_id)

    # Fetch users
    user_map: Dict[str, ActivityActorDTO] = {}
    if author_ids:
        users_list = await user_repo.get_by_ids(list(author_ids))
        for u in users_list:
            user_map[str(u.id)] = ActivityActorDTO(
                id=str(u.id),
                username=u.username,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
            )

    items: List[ActivityItem] = []

    for p in p_rows:
        actor = user_map.get(str(p.author_id))
        if actor:
            items.append(ActivityItem(
                id=f"problem-{p.id}",
                type="problem_created",
                actor=actor,
                target_title=p.title,
                target_id=str(p.id),
                created_at=p.created_at.isoformat(),
            ))

    for i in i_rows:
        actor = user_map.get(str(i.author_id))
        if actor:
            items.append(ActivityItem(
                id=f"idea-{i.id}",
                type="idea_created",
                actor=actor,
                target_title=i.title,
                target_id=str(i.id),
                created_at=i.created_at.isoformat(),
            ))

    for c in c_rows:
        actor = user_map.get(str(c.author_id))
        if actor:
            # Get target title
            target_title = ""
            if c.target_type == "problem":
                target = (await session.execute(
                    select(ProblemModel.title).where(ProblemModel.id == c.target_id)
                )).scalar_one_or_none()
                target_title = target or ""
            elif c.target_type == "idea":
                target = (await session.execute(
                    select(IdeaModel.title).where(IdeaModel.id == c.target_id)
                )).scalar_one_or_none()
                target_title = target or ""

            items.append(ActivityItem(
                id=f"comment-{c.id}",
                type="comment_added",
                actor=actor,
                target_title=target_title,
                target_id=str(c.target_id),
                created_at=c.created_at.isoformat(),
            ))

    items.sort(key=lambda x: x.created_at, reverse=True)
    return items[:limit]
