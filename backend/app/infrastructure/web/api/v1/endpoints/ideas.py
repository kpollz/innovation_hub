"""Idea endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Body

from app.application.dto.idea_dto import (
    CreateIdeaDTO,
    UpdateIdeaDTO,
    IdeaListFiltersDTO,
    IdeaResponseDTO,
    IdeaListResponseDTO
)
from app.application.dto.vote_dto import CreateVoteDTO, VoteResponseDTO
from app.application.use_cases.idea.create_idea import CreateIdeaUseCase
from app.application.use_cases.idea.update_idea import UpdateIdeaUseCase
from app.application.use_cases.idea.vote_idea import VoteIdeaUseCase
from app.infrastructure.database.repositories.idea_repository_impl import SQLIdeaRepository
from app.infrastructure.database.repositories.room_repository_impl import SQLRoomRepository
from app.infrastructure.database.repositories.vote_repository_impl import SQLVoteRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("", response_model=IdeaListResponseDTO)
async def list_ideas(
    filters: IdeaListFiltersDTO = Depends(),
    page: int = 1,
    limit: int = 20,
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo)
):
    """List ideas with pagination and filters."""
    ideas, total = await idea_repo.list(filters.model_dump(exclude_none=True), page, limit)
    return IdeaListResponseDTO(
        items=[IdeaResponseDTO.model_validate(i) for i in ideas],
        total=total,
        page=page,
        limit=limit
    )


@router.post("", response_model=IdeaResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_idea(
    data: CreateIdeaDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo)
):
    """Create a new idea."""
    use_case = CreateIdeaUseCase(idea_repo, room_repo)
    return await use_case.execute(data, current_user.id)


@router.get("/{idea_id}", response_model=IdeaResponseDTO)
async def get_idea(
    idea_id: UUID,
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo)
):
    """Get an idea by ID."""
    idea = await idea_repo.get_by_id(idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
    return IdeaResponseDTO.model_validate(idea)


@router.patch("/{idea_id}", response_model=IdeaResponseDTO)
async def update_idea(
    idea_id: UUID,
    data: UpdateIdeaDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo)
):
    """Update an idea."""
    use_case = UpdateIdeaUseCase(idea_repo)
    return await use_case.execute(
        idea_id,
        data,
        current_user.id,
        current_user.role == "admin"
    )


@router.post("/{idea_id}/votes", response_model=VoteResponseDTO, status_code=status.HTTP_201_CREATED)
async def vote_idea(
    idea_id: UUID,
    stars: int = Body(..., embed=True, ge=1, le=5),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo)
):
    """Vote on an idea."""
    data = CreateVoteDTO(idea_id=idea_id, stars=stars)
    use_case = VoteIdeaUseCase(vote_repo, idea_repo)
    return await use_case.execute(data, current_user.id)