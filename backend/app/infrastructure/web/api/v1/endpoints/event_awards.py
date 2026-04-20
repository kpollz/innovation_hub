"""Event awards endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.event_award_dto import (
    CreateAwardRequest, UpdateAwardRequest, AddTeamToAwardRequest,
    AwardResponse, AwardListResponse,
)
from app.application.use_cases.event_award.list_awards import ListAwardsUseCase
from app.application.use_cases.event_award.create_award import CreateAwardUseCase
from app.application.use_cases.event_award.update_award import UpdateAwardUseCase
from app.application.use_cases.event_award.delete_award import DeleteAwardUseCase
from app.application.use_cases.event_award.add_team_to_award import AddTeamToAwardUseCase
from app.application.use_cases.event_award.remove_team_from_award import RemoveTeamFromAwardUseCase
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.infrastructure.database.repositories.event_repository_impl import SQLEventRepository
from app.infrastructure.database.repositories.event_team_repository_impl import SQLEventTeamRepository
from app.infrastructure.database.repositories.event_award_repository_impl import SQLEventAwardRepository, SQLEventAwardTeamRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("/awards", response_model=AwardListResponse)
async def list_awards(
    event_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    award_repo: SQLEventAwardRepository = Depends(deps.get_event_award_repo),
    award_team_repo: SQLEventAwardTeamRepository = Depends(deps.get_event_award_team_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """List awards with teams for an event."""
    use_case = ListAwardsUseCase(event_repo, award_repo, award_team_repo, team_repo, user_repo)
    try:
        return await use_case.execute(event_id)
    except NotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/awards", response_model=AwardResponse, status_code=status.HTTP_201_CREATED)
async def create_award(
    event_id: UUID,
    data: CreateAwardRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    award_repo: SQLEventAwardRepository = Depends(deps.get_event_award_repo),
):
    """Create a new award tier. Admin only."""
    use_case = CreateAwardUseCase(event_repo, award_repo)
    try:
        award = await use_case.execute(
            event_id=event_id,
            name=data.name,
            rank_order=data.rank_order,
            is_admin=current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return AwardResponse(
        id=award.id, event_id=award.event_id, name=award.name,
        rank_order=award.rank_order, teams=[], created_at=award.created_at, updated_at=award.updated_at,
    )


@router.patch("/awards/{award_id}", response_model=AwardResponse)
async def update_award(
    event_id: UUID,
    award_id: UUID,
    data: UpdateAwardRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    award_repo: SQLEventAwardRepository = Depends(deps.get_event_award_repo),
):
    """Update award. Admin only."""
    use_case = UpdateAwardUseCase(award_repo)
    try:
        await use_case.execute(
            award_id=award_id,
            name=data.name,
            rank_order=data.rank_order,
            is_admin=current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    # Fetch updated award for response
    updated = await award_repo.get_by_id(award_id)
    return AwardResponse(
        id=updated.id, event_id=updated.event_id, name=updated.name,
        rank_order=updated.rank_order, teams=[], created_at=updated.created_at, updated_at=updated.updated_at,
    )


@router.delete("/awards/{award_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_award(
    event_id: UUID,
    award_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    award_repo: SQLEventAwardRepository = Depends(deps.get_event_award_repo),
    award_team_repo: SQLEventAwardTeamRepository = Depends(deps.get_event_award_team_repo),
):
    """Delete award. Admin only."""
    use_case = DeleteAwardUseCase(award_repo, award_team_repo)
    try:
        await use_case.execute(
            award_id=award_id,
            is_admin=current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/awards/{award_id}/teams", status_code=status.HTTP_204_NO_CONTENT)
async def add_team_to_award(
    event_id: UUID,
    award_id: UUID,
    data: AddTeamToAwardRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    award_repo: SQLEventAwardRepository = Depends(deps.get_event_award_repo),
    award_team_repo: SQLEventAwardTeamRepository = Depends(deps.get_event_award_team_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
):
    """Add team to award. Admin only."""
    use_case = AddTeamToAwardUseCase(award_repo, award_team_repo, team_repo)
    try:
        await use_case.execute(
            award_id=award_id,
            team_id=data.team_id,
            is_admin=current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException, ConflictException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/awards/{award_id}/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_from_award(
    event_id: UUID,
    award_id: UUID,
    team_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    award_repo: SQLEventAwardRepository = Depends(deps.get_event_award_repo),
    award_team_repo: SQLEventAwardTeamRepository = Depends(deps.get_event_award_team_repo),
):
    """Remove team from award. Admin only."""
    use_case = RemoveTeamFromAwardUseCase(award_repo, award_team_repo)
    try:
        await use_case.execute(
            award_id=award_id,
            team_id=team_id,
            is_admin=current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
