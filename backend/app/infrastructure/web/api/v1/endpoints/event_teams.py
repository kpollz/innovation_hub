"""Event Team endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.event_team_dto import (
    CreateEventTeamDTO,
    EventTeamResponseDTO,
    EventTeamListResponseDTO,
    EventTeamMemberResponseDTO,
    UpdateMemberStatusDTO,
    TransferLeadDTO,
)
from app.application.use_cases.event_team.create_team import CreateEventTeamUseCase
from app.application.use_cases.event_team.list_teams import ListEventTeamsUseCase
from app.application.use_cases.event_team.join_team import JoinEventTeamUseCase
from app.application.use_cases.event_team.update_member_status import UpdateMemberStatusUseCase
from app.application.use_cases.event_team.disband_team import DisbandEventTeamUseCase
from app.application.use_cases.event_team.leave_team import LeaveEventTeamUseCase
from app.application.use_cases.event_team.transfer_lead import TransferTeamLeadUseCase
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    ConflictException,
)
from app.infrastructure.database.repositories.event_repository_impl import SQLEventRepository
from app.infrastructure.database.repositories.event_team_repository_impl import SQLEventTeamRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


# --- Enrichment helpers ---

async def _enrich_team(team, user_repo, team_repo) -> EventTeamResponseDTO:
    """Enrich team with leader info, member count, etc."""
    dto = EventTeamResponseDTO.model_validate(team)

    # Leader info
    leader = await user_repo.get_by_id(team.leader_id)
    if leader:
        dto.leader = {
            "id": leader.id,
            "username": leader.username,
            "full_name": leader.full_name,
            "avatar_url": leader.avatar_url,
        }

    # Member count (active only)
    dto.member_count = await team_repo.get_member_count(team.id)

    # Assigned team info (for review)
    if team.assigned_to_team_id:
        assigned_team = await team_repo.get_team_by_id(team.assigned_to_team_id)
        if assigned_team:
            dto.assigned_to_team = {"id": assigned_team.id, "name": assigned_team.name}

    # Idea count
    dto.idea_count = await team_repo.get_idea_count(team.id)

    return dto


async def _enrich_member(member, user_repo) -> EventTeamMemberResponseDTO:
    """Enrich member with user info."""
    dto = EventTeamMemberResponseDTO.model_validate(member)

    user = await user_repo.get_by_id(member.user_id)
    if user:
        dto.user = {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
        }

    return dto


# --- Endpoints ---


@router.post("", response_model=EventTeamResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_team(
    event_id: UUID,
    data: CreateEventTeamDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Create a new team. Creator becomes Team Lead."""
    use_case = CreateEventTeamUseCase(event_repo, team_repo)
    try:
        team = await use_case.execute(event_id, data, current_user.id)
    except (NotFoundException, ForbiddenException, ConflictException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return await _enrich_team(team, user_repo, team_repo)


@router.get("", response_model=EventTeamListResponseDTO)
async def list_teams(
    event_id: UUID,
    page: int = 1,
    limit: int = 20,
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """List all teams in an event."""
    use_case = ListEventTeamsUseCase(event_repo, team_repo)
    try:
        teams, total = await use_case.execute(event_id, page, limit)
    except NotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    items = []
    for team in teams:
        items.append(await _enrich_team(team, user_repo, team_repo))

    return EventTeamListResponseDTO(items=items, total=total, page=page, limit=limit)


@router.post(
    "/{team_id}/join",
    response_model=EventTeamMemberResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def join_team(
    event_id: UUID,
    team_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Request to join a team. Creates pending membership."""
    use_case = JoinEventTeamUseCase(event_repo, team_repo)
    try:
        member = await use_case.execute(event_id, team_id, current_user.id)
    except (NotFoundException, ForbiddenException, ConflictException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return await _enrich_member(member, user_repo)


@router.patch("/{team_id}/members/{user_id}", response_model=EventTeamMemberResponseDTO)
async def update_member_status(
    event_id: UUID,
    team_id: UUID,
    user_id: UUID,
    data: UpdateMemberStatusDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Team Lead approves or rejects a join request."""
    use_case = UpdateMemberStatusUseCase(event_repo, team_repo)
    try:
        member = await use_case.execute(
            event_id, team_id, user_id, data.status,
            current_user.id, current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return await _enrich_member(member, user_repo)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disband_team(
    event_id: UUID,
    team_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
):
    """Team Lead disbands team. Cascade deletes all members."""
    use_case = DisbandEventTeamUseCase(event_repo, team_repo)
    try:
        await use_case.execute(
            event_id, team_id, current_user.id, current_user.role == "admin"
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return None


@router.delete("/{team_id}/members/me", status_code=status.HTTP_204_NO_CONTENT)
async def leave_team(
    event_id: UUID,
    team_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
):
    """Member leaves team. Team Lead cannot leave (must transfer or disband)."""
    use_case = LeaveEventTeamUseCase(event_repo, team_repo)
    try:
        await use_case.execute(event_id, team_id, current_user.id)
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return None


@router.patch("/{team_id}/transfer-lead", response_model=EventTeamResponseDTO)
async def transfer_lead(
    event_id: UUID,
    team_id: UUID,
    data: TransferLeadDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Transfer team leadership to another active member."""
    use_case = TransferTeamLeadUseCase(event_repo, team_repo)
    try:
        team = await use_case.execute(
            event_id, team_id, data.new_leader_id,
            current_user.id, current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return await _enrich_team(team, user_repo, team_repo)
