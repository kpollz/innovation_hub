"""User endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.user_dto import (
    UpdateUserDTO,
    UserResponseDTO,
    UserListResponseDTO
)
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO as AuthUser
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("/me", response_model=UserResponseDTO)
async def get_current_user_info(
    current_user: AuthUser = Depends(get_current_active_user)
):
    """Get current user info."""
    return current_user


@router.get("", response_model=UserListResponseDTO)
async def list_users(
    page: int = 1,
    limit: int = 20,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo)
):
    """List users with pagination."""
    users, total = await user_repo.list(page=page, limit=limit)
    return UserListResponseDTO(
        items=[UserResponseDTO.model_validate(u) for u in users],
        total=total,
        page=page,
        limit=limit
    )


@router.get("/{user_id}", response_model=UserResponseDTO)
async def get_user(
    user_id: UUID,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo)
):
    """Get a user by ID."""
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponseDTO.model_validate(user)


@router.patch("/me", response_model=UserResponseDTO)
async def update_current_user(
    data: UpdateUserDTO,
    current_user: AuthUser = Depends(get_current_active_user),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo)
):
    """Update current user profile."""
    user = await user_repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.team is not None:
        user.team = data.team
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    
    updated = await user_repo.update(user)
    return UserResponseDTO.model_validate(updated)
