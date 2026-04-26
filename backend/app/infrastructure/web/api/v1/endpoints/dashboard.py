"""Dashboard endpoints."""
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, cast, Date, select, Float
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.problem_dto import ProblemResponseDTO
from app.application.dto.idea_dto import IdeaResponseDTO
from app.application.dto.user_dto import UserResponseDTO
from app.application.services.response_enrichment import enrich_problems, enrich_ideas
from app.infrastructure.database.models.problem_model import ProblemModel, problem_shared_users
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
    session: AsyncSession = Depends(deps.get_db_session),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
):
    """Get trending ideas sorted by engagement (vote_avg, likes, comments, time)."""
    from app.infrastructure.database.models.room_model import RoomModel
    from app.infrastructure.database.models.vote_model import VoteModel
    from app.infrastructure.database.models.reaction_model import ReactionModel

    is_admin = current_user.role == "admin"
    uid = current_user.id

    # Subqueries for aggregated metrics
    vote_avg_sq = (
        select(VoteModel.idea_id, func.avg(VoteModel.stars.cast(Float)).label("vote_avg"))
        .group_by(VoteModel.idea_id)
        .subquery()
    )
    likes_sq = (
        select(ReactionModel.target_id, func.count().label("likes_count"))
        .where(ReactionModel.target_type == "idea", ReactionModel.type == "like")
        .group_by(ReactionModel.target_id)
        .subquery()
    )
    comments_sq = (
        select(CommentModel.target_id, func.count().label("comments_count"))
        .where(CommentModel.target_type == "idea")
        .group_by(CommentModel.target_id)
        .subquery()
    )

    # Base query with joins for sorting
    query = (
        select(IdeaModel)
        .options(selectinload(IdeaModel.author), selectinload(IdeaModel.room))
        .join(RoomModel, IdeaModel.room_id == RoomModel.id)
        .outerjoin(vote_avg_sq, IdeaModel.id == vote_avg_sq.c.idea_id)
        .outerjoin(likes_sq, IdeaModel.id == likes_sq.c.target_id)
        .outerjoin(comments_sq, IdeaModel.id == comments_sq.c.target_id)
    )

    # Privacy filter: public rooms, or user's own rooms, or rooms shared with user, or admin
    if not is_admin:
        from app.infrastructure.database.models.room_model import room_shared_users
        shared_sq = (
            select(room_shared_users.c.room_id)
            .where(room_shared_users.c.user_id == uid)
            .subquery()
        )
        query = query.where(
            (RoomModel.visibility == "public")
            | (RoomModel.created_by == uid)
            | (IdeaModel.author_id == uid)
            | (RoomModel.id.in_(select(shared_sq.c.room_id)))
        )

    # Sort: vote_avg DESC → likes_count DESC → (likes + comments) DESC → created_at DESC
    vote_avg_col = func.coalesce(vote_avg_sq.c.vote_avg, 0)
    likes_col = func.coalesce(likes_sq.c.likes_count, 0)
    comments_col = func.coalesce(comments_sq.c.comments_count, 0)

    query = query.order_by(
        vote_avg_col.desc(),
        likes_col.desc(),
        (likes_col + comments_col).desc(),
        IdeaModel.created_at.desc(),
    ).limit(limit)

    rows = (await session.execute(query)).scalars().all()

    # Enrich with reaction counts, comment counts, vote data, author
    return await enrich_ideas(
        list(rows), user_repo, reaction_repo, comment_repo, vote_repo, uid
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
    target_type: str  # 'problem' | 'idea' | 'room'
    created_at: str
    extra: dict | None = None


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
    """Get recent activity feed. Available to all authenticated users, privacy-filtered."""
    from app.infrastructure.database.models.room_model import RoomModel, room_shared_users
    from app.infrastructure.database.models.reaction_model import ReactionModel
    from app.infrastructure.database.models.vote_model import VoteModel

    is_admin = current_user.role == "admin"
    uid = current_user.id

    # --- Build visibility sets for privacy filtering ---
    # Visible problems: public, owned by user, shared with user, or admin sees all
    if is_admin:
        visible_problem_ids = None  # None means no filter
        visible_room_ids = None
    else:
        # Visible problems
        own_problem_ids = (
            select(ProblemModel.id).where(ProblemModel.author_id == uid)
        )
        shared_problem_ids = (
            select(ProblemModel.id)
            .join(problem_shared_users, ProblemModel.id == problem_shared_users.c.problem_id)
            .where(problem_shared_users.c.user_id == uid)
        )
        public_problem_ids = (
            select(ProblemModel.id).where(ProblemModel.visibility == "public")
        )
        visible_problem_ids = await session.execute(
            select(ProblemModel.id).where(
                ProblemModel.id.in_(own_problem_ids.union(shared_problem_ids, public_problem_ids))
            )
        )
        vis_prob_set = set(str(r[0]) for r in visible_problem_ids.all())

        # Visible rooms
        own_room_ids = (
            select(RoomModel.id).where(RoomModel.created_by == uid)
        )
        shared_room_ids = (
            select(RoomModel.id)
            .join(room_shared_users, RoomModel.id == room_shared_users.c.room_id)
            .where(room_shared_users.c.user_id == uid)
        )
        public_room_ids = (
            select(RoomModel.id).where(RoomModel.visibility == "public")
        )
        visible_room_result = await session.execute(
            select(RoomModel.id).where(
                RoomModel.id.in_(own_room_ids.union(shared_room_ids, public_room_ids))
            )
        )
        vis_room_set = set(str(r[0]) for r in visible_room_result.all())

        # Visible ideas = ideas in visible rooms OR authored by user
        idea_filter = (IdeaModel.author_id == uid)
        if vis_room_set:
            idea_filter = idea_filter | (IdeaModel.room_id.in_(vis_room_set))
        visible_idea_result = await session.execute(
            select(IdeaModel.id).where(idea_filter)
        )
        vis_idea_set = set(str(r[0]) for r in visible_idea_result.all())

    # --- Fetch raw activity rows ---
    p_rows = (await session.execute(
        select(ProblemModel).order_by(ProblemModel.created_at.desc()).limit(20)
    )).scalars().all()

    i_rows = (await session.execute(
        select(IdeaModel).order_by(IdeaModel.created_at.desc()).limit(20)
    )).scalars().all()

    c_rows = (await session.execute(
        select(CommentModel).order_by(CommentModel.created_at.desc()).limit(20)
    )).scalars().all()

    r_rows = (await session.execute(
        select(ReactionModel).order_by(ReactionModel.created_at.desc()).limit(20)
    )).scalars().all()

    v_rows = (await session.execute(
        select(VoteModel).order_by(VoteModel.created_at.desc()).limit(20)
    )).scalars().all()

    room_rows = (await session.execute(
        select(RoomModel).order_by(RoomModel.created_at.desc()).limit(20)
    )).scalars().all()

    # --- Collect all actor IDs ---
    author_ids: set = set()
    for row in p_rows:
        author_ids.add(row.author_id)
    for row in i_rows:
        author_ids.add(row.author_id)
    for row in c_rows:
        author_ids.add(row.author_id)
    for row in r_rows:
        author_ids.add(row.user_id)
    for row in v_rows:
        author_ids.add(row.user_id)
    for row in room_rows:
        author_ids.add(row.created_by)

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

    # Problem created
    for p in p_rows:
        if not is_admin and str(p.id) not in vis_prob_set:
            continue
        actor = user_map.get(str(p.author_id))
        if actor:
            items.append(ActivityItem(
                id=f"problem-{p.id}",
                type="problem_created",
                actor=actor,
                target_title=p.title,
                target_id=str(p.id),
                target_type="problem",
                created_at=p.created_at.isoformat(),
            ))

    # Idea created
    for i in i_rows:
        if not is_admin and str(i.id) not in vis_idea_set:
            continue
        actor = user_map.get(str(i.author_id))
        if actor:
            items.append(ActivityItem(
                id=f"idea-{i.id}",
                type="idea_created",
                actor=actor,
                target_title=i.title,
                target_id=str(i.id),
                target_type="idea",
                created_at=i.created_at.isoformat(),
            ))

    # Comment added
    for c in c_rows:
        target_title = ""
        target_type = c.target_type  # 'problem' or 'idea'
        if c.target_type == "problem":
            if not is_admin and str(c.target_id) not in vis_prob_set:
                continue
            title = (await session.execute(
                select(ProblemModel.title).where(ProblemModel.id == c.target_id)
            )).scalar_one_or_none()
            target_title = title or ""
        elif c.target_type == "idea":
            if not is_admin and str(c.target_id) not in vis_idea_set:
                continue
            title = (await session.execute(
                select(IdeaModel.title).where(IdeaModel.id == c.target_id)
            )).scalar_one_or_none()
            target_title = title or ""
        else:
            continue

        actor = user_map.get(str(c.author_id))
        if actor:
            items.append(ActivityItem(
                id=f"comment-{c.id}",
                type="comment_added",
                actor=actor,
                target_title=target_title,
                target_id=str(c.target_id),
                target_type=target_type,
                created_at=c.created_at.isoformat(),
            ))

    # Reaction added
    for r in r_rows:
        target_title = ""
        target_type = r.target_type
        if r.target_type == "problem":
            if not is_admin and str(r.target_id) not in vis_prob_set:
                continue
            title = (await session.execute(
                select(ProblemModel.title).where(ProblemModel.id == r.target_id)
            )).scalar_one_or_none()
            target_title = title or ""
        elif r.target_type == "idea":
            if not is_admin and str(r.target_id) not in vis_idea_set:
                continue
            title = (await session.execute(
                select(IdeaModel.title).where(IdeaModel.id == r.target_id)
            )).scalar_one_or_none()
            target_title = title or ""
        else:
            continue

        actor = user_map.get(str(r.user_id))
        if actor:
            items.append(ActivityItem(
                id=f"reaction-{r.id}",
                type="reaction_added",
                actor=actor,
                target_title=target_title,
                target_id=str(r.target_id),
                target_type=target_type,
                created_at=r.created_at.isoformat(),
                extra={"reaction_type": r.type},
            ))

    # Vote added
    for v in v_rows:
        if not is_admin and str(v.idea_id) not in vis_idea_set:
            continue
        title = (await session.execute(
            select(IdeaModel.title).where(IdeaModel.id == v.idea_id)
        )).scalar_one_or_none()
        target_title = title or ""

        actor = user_map.get(str(v.user_id))
        if actor:
            items.append(ActivityItem(
                id=f"vote-{v.id}",
                type="vote_added",
                actor=actor,
                target_title=target_title,
                target_id=str(v.idea_id),
                target_type="idea",
                created_at=v.created_at.isoformat(),
                extra={"stars": v.stars},
            ))

    # Room created
    for rm in room_rows:
        if not is_admin and str(rm.id) not in vis_room_set:
            continue
        actor = user_map.get(str(rm.created_by))
        if actor:
            items.append(ActivityItem(
                id=f"room-{rm.id}",
                type="room_created",
                actor=actor,
                target_title=rm.name,
                target_id=str(rm.id),
                target_type="room",
                created_at=rm.created_at.isoformat(),
            ))

    items.sort(key=lambda x: x.created_at, reverse=True)
    return items[:limit]
