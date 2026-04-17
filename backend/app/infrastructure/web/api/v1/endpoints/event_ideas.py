"""Event Idea endpoints."""
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.dto.event_idea_dto import (
    CreateEventIdeaDTO,
    CreateEventIdeaFromRoomDTO,
    UpdateEventIdeaDTO,
    EventIdeaResponseDTO,
    EventIdeaListResponseDTO,
)
from app.application.use_cases.event_idea.create_idea import CreateEventIdeaUseCase
from app.application.use_cases.event_idea.create_idea_from_room import CreateEventIdeaFromRoomUseCase
from app.application.use_cases.event_idea.list_ideas import ListEventIdeasUseCase
from app.application.use_cases.event_idea.get_idea import GetEventIdeaUseCase
from app.application.use_cases.event_idea.update_idea import UpdateEventIdeaUseCase
from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.entities.notification import Notification
from app.infrastructure.database.repositories.event_repository_impl import SQLEventRepository
from app.infrastructure.database.repositories.event_team_repository_impl import SQLEventTeamRepository
from app.infrastructure.database.repositories.event_idea_repository_impl import SQLEventIdeaRepository
from app.infrastructure.database.repositories.idea_repository_impl import SQLIdeaRepository
from app.infrastructure.database.repositories.notification_repository_impl import SQLNotificationRepository
from app.infrastructure.database.repositories.room_repository_impl import SQLRoomRepository
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

logger = logging.getLogger(__name__)

router = APIRouter()


# --- Enrichment ---


async def _notify_admins_idea_submitted(
    event_id: UUID,
    idea_title: str,
    actor_id: UUID,
    event_repo: SQLEventRepository,
    user_repo: SQLUserRepository,
    notification_repo: SQLNotificationRepository,
):
    """Notify all admins when a new idea is submitted in an event."""
    try:
        event = await event_repo.get_by_id(event_id)
        admins, _ = await user_repo.list(filters={"role": "admin"}, limit=100)
        notifications = [
            Notification(
                user_id=admin.id,
                actor_id=actor_id,
                type="event_idea_submitted",
                target_id=event_id,
                target_type="event",
                target_title=event.title if event else "",
                action_detail=idea_title,
            )
            for admin in admins
            if admin.id != actor_id
        ]
        if notifications:
            await notification_repo.create_bulk(notifications)
    except Exception:
        logger.exception("Failed to send event_idea_submitted notification")


async def _enrich_idea(idea, user_repo, team_repo) -> EventIdeaResponseDTO:
    """Enrich idea with author and team info."""
    dto = EventIdeaResponseDTO.model_validate(idea)

    # Author
    author = await user_repo.get_by_id(idea.author_id)
    if author:
        dto.author = {
            "id": author.id,
            "username": author.username,
            "full_name": author.full_name,
            "avatar_url": author.avatar_url,
        }

    # Team
    team = await team_repo.get_team_by_id(idea.team_id)
    if team:
        dto.team = {"id": team.id, "name": team.name, "slogan": team.slogan}

    return dto


# --- Endpoints ---


@router.post("", response_model=EventIdeaResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_idea(
    event_id: UUID,
    data: CreateEventIdeaDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    idea_repo: SQLEventIdeaRepository = Depends(deps.get_event_idea_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
):
    """Submit a new idea via manual form. Auto-fills team_id from membership."""
    use_case = CreateEventIdeaUseCase(event_repo, team_repo, idea_repo)
    try:
        idea = await use_case.execute(event_id, data, current_user.id)
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    await _notify_admins_idea_submitted(
        event_id, idea.title, current_user.id,
        event_repo, user_repo, notification_repo,
    )

    return await _enrich_idea(idea, user_repo, team_repo)


@router.post("/from-room", response_model=EventIdeaResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_idea_from_room(
    event_id: UUID,
    data: CreateEventIdeaFromRoomDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    idea_repo: SQLEventIdeaRepository = Depends(deps.get_event_idea_repo),
    room_idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
):
    """Submit an idea from a brainstorming room. Copies content as independent record."""
    use_case = CreateEventIdeaFromRoomUseCase(
        event_repo, team_repo, idea_repo, room_idea_repo, room_repo, problem_repo
    )
    try:
        idea = await use_case.execute(event_id, data.room_id, data.idea_id, current_user.id)
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    await _notify_admins_idea_submitted(
        event_id, idea.title, current_user.id,
        event_repo, user_repo, notification_repo,
    )

    return await _enrich_idea(idea, user_repo, team_repo)


@router.get("", response_model=EventIdeaListResponseDTO)
async def list_ideas(
    event_id: UUID,
    team_id: Optional[UUID] = Query(None),
    sort: str = Query("newest", pattern="^(score|newest)$"),
    page: int = 1,
    limit: int = 20,
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    idea_repo: SQLEventIdeaRepository = Depends(deps.get_event_idea_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """List ideas in an event with optional filters."""
    use_case = ListEventIdeasUseCase(event_repo, idea_repo)
    try:
        ideas, total = await use_case.execute(event_id, team_id, sort, page, limit)
    except NotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    items = []
    for idea in ideas:
        items.append(await _enrich_idea(idea, user_repo, team_repo))

    return EventIdeaListResponseDTO(items=items, total=total, page=page, limit=limit)


@router.get("/{idea_id}", response_model=EventIdeaResponseDTO)
async def get_idea(
    event_id: UUID,
    idea_id: UUID,
    idea_repo: SQLEventIdeaRepository = Depends(deps.get_event_idea_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Get idea detail."""
    use_case = GetEventIdeaUseCase(idea_repo)
    try:
        idea = await use_case.execute(idea_id)
    except NotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    if idea.event_id != event_id:
        raise HTTPException(status_code=404, detail="Idea not found in this event")

    return await _enrich_idea(idea, user_repo, team_repo)


@router.patch("/{idea_id}", response_model=EventIdeaResponseDTO)
async def update_idea(
    event_id: UUID,
    idea_id: UUID,
    data: UpdateEventIdeaDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    idea_repo: SQLEventIdeaRepository = Depends(deps.get_event_idea_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Edit idea (author, team lead, or admin). Only when event is active."""
    use_case = UpdateEventIdeaUseCase(event_repo, team_repo, idea_repo)
    try:
        idea = await use_case.execute(
            event_id, idea_id, data, current_user.id, current_user.role == "admin"
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return await _enrich_idea(idea, user_repo, team_repo)
