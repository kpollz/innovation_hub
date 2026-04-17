"""Event Idea endpoints."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.dto.event_idea_dto import (
    CreateEventIdeaDTO,
    UpdateEventIdeaDTO,
    EventIdeaResponseDTO,
    EventIdeaListResponseDTO,
)
from app.application.use_cases.event_idea.create_idea import CreateEventIdeaUseCase
from app.application.use_cases.event_idea.list_ideas import ListEventIdeasUseCase
from app.application.use_cases.event_idea.get_idea import GetEventIdeaUseCase
from app.application.use_cases.event_idea.update_idea import UpdateEventIdeaUseCase
from app.core.exceptions import NotFoundException, ForbiddenException
from app.infrastructure.database.repositories.event_repository_impl import SQLEventRepository
from app.infrastructure.database.repositories.event_team_repository_impl import SQLEventTeamRepository
from app.infrastructure.database.repositories.event_idea_repository_impl import SQLEventIdeaRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


# --- Enrichment ---

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
):
    """Submit a new idea via manual form. Auto-fills team_id from membership."""
    use_case = CreateEventIdeaUseCase(event_repo, team_repo, idea_repo)
    try:
        idea = await use_case.execute(event_id, data, current_user.id)
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
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
