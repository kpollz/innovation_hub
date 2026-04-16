"""Event endpoints."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.dto.event_dto import (
    CreateEventDTO,
    UpdateEventDTO,
    EventResponseDTO,
    EventListResponseDTO,
)
from app.application.dto.event_team_dto import (
    AssignmentsResponseDTO,
    AssignmentEntryDTO,
    EventTeamAssignedDTO,
)
from app.application.services.response_enrichment import enrich_event, enrich_events
from app.application.use_cases.event.create_event import CreateEventUseCase
from app.application.use_cases.event.update_event import UpdateEventUseCase
from app.application.use_cases.event.delete_event import DeleteEventUseCase
from app.application.use_cases.event.close_event import CloseEventUseCase
from app.infrastructure.database.repositories.event_repository_impl import SQLEventRepository
from app.infrastructure.database.repositories.event_team_repository_impl import SQLEventTeamRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.post("", response_model=EventResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: CreateEventDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Create a new event (Admin only)."""
    use_case = CreateEventUseCase(event_repo)
    event = await use_case.execute(data, current_user.id, current_user.role == "admin")
    return await enrich_event(event, user_repo, event_repo)


@router.get("", response_model=EventListResponseDTO)
async def list_events(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: draft|active|closed"),
    page: int = 1,
    limit: int = 20,
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """List all events with optional status filter."""
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    events, total = await event_repo.list(filters, page, limit)
    items = await enrich_events(events, user_repo, event_repo)
    return EventListResponseDTO(items=items, total=total, page=page, limit=limit)


@router.get("/{event_id}", response_model=EventResponseDTO)
async def get_event(
    event_id: UUID,
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Get event details by ID."""
    event = await event_repo.get_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    return await enrich_event(event, user_repo, event_repo)


@router.patch("/{event_id}", response_model=EventResponseDTO)
async def update_event(
    event_id: UUID,
    data: UpdateEventDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Update an event (Admin only, not allowed when closed)."""
    use_case = UpdateEventUseCase(event_repo)
    event = await use_case.execute(
        event_id, data, current_user.id, current_user.role == "admin"
    )
    return await enrich_event(event, user_repo, event_repo)


@router.patch("/{event_id}/close", response_model=EventResponseDTO)
async def close_event(
    event_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Close an event (Admin only). Makes event read-only."""
    use_case = CloseEventUseCase(event_repo)
    event = await use_case.execute(
        event_id, current_user.id, current_user.role == "admin"
    )
    return await enrich_event(event, user_repo, event_repo)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
):
    """Delete an event (Admin only)."""
    use_case = DeleteEventUseCase(event_repo)
    success = await use_case.execute(
        event_id, current_user.id, current_user.role == "admin"
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    return None


@router.get("/{event_id}/assignments", response_model=AssignmentsResponseDTO)
async def list_assignments(
    event_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
):
    """View full review assignment map for an event."""
    event = await event_repo.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    teams, _ = await team_repo.list_teams_by_event(event_id, page=1, limit=200)

    assignments = []
    for team in teams:
        entry = AssignmentEntryDTO(
            team=EventTeamAssignedDTO(id=team.id, name=team.name),
            reviews=None,
        )
        if team.assigned_to_team_id:
            target = await team_repo.get_team_by_id(team.assigned_to_team_id)
            if target:
                entry.reviews = EventTeamAssignedDTO(id=target.id, name=target.name)
        assignments.append(entry)

    return AssignmentsResponseDTO(assignments=assignments)
