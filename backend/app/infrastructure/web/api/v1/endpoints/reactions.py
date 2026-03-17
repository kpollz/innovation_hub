"""Reaction endpoints for problems and ideas."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.domain.entities.reaction import Reaction, ReactionType
from app.application.dto.reaction_dto import ReactionResponseDTO
from app.infrastructure.database.repositories.reaction_repository_impl import SQLReactionRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

problem_reactions_router = APIRouter()
idea_reactions_router = APIRouter()


class ReactionRequest(BaseModel):
    type: ReactionType


# --- Problem Reactions ---

@problem_reactions_router.post(
    "/{problem_id}/reactions",
    response_model=ReactionResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def toggle_problem_reaction(
    problem_id: UUID,
    data: ReactionRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
):
    """Add or toggle a reaction on a problem.

    - Same type again → remove (toggle off), returns 204.
    - Different type → update to new type.
    - No existing → create new.
    """
    existing = await reaction_repo.get_by_user_and_target(
        current_user.id, problem_id, "problem"
    )

    if existing:
        if existing.type == data.type:
            # Toggle off
            await reaction_repo.delete(existing.id)
            raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)
        # Change type
        existing.change_type(data.type)
        updated = await reaction_repo.update(existing)
        return ReactionResponseDTO.model_validate(updated)

    # Create new
    reaction = Reaction(
        target_id=problem_id,
        target_type="problem",
        type=data.type,
        user_id=current_user.id,
    )
    created = await reaction_repo.create(reaction)
    return ReactionResponseDTO.model_validate(created)


@problem_reactions_router.delete(
    "/{problem_id}/reactions",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_problem_reaction(
    problem_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
):
    """Remove current user's reaction from a problem."""
    existing = await reaction_repo.get_by_user_and_target(
        current_user.id, problem_id, "problem"
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reaction found",
        )
    await reaction_repo.delete(existing.id)
    return None


# --- Idea Reactions ---

@idea_reactions_router.post(
    "/{idea_id}/reactions",
    response_model=ReactionResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def toggle_idea_reaction(
    idea_id: UUID,
    data: ReactionRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
):
    """Add or toggle a reaction on an idea."""
    existing = await reaction_repo.get_by_user_and_target(
        current_user.id, idea_id, "idea"
    )

    if existing:
        if existing.type == data.type:
            await reaction_repo.delete(existing.id)
            raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)
        existing.change_type(data.type)
        updated = await reaction_repo.update(existing)
        return ReactionResponseDTO.model_validate(updated)

    reaction = Reaction(
        target_id=idea_id,
        target_type="idea",
        type=data.type,
        user_id=current_user.id,
    )
    created = await reaction_repo.create(reaction)
    return ReactionResponseDTO.model_validate(created)


@idea_reactions_router.delete(
    "/{idea_id}/reactions",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_idea_reaction(
    idea_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
):
    """Remove current user's reaction from an idea."""
    existing = await reaction_repo.get_by_user_and_target(
        current_user.id, idea_id, "idea"
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reaction found",
        )
    await reaction_repo.delete(existing.id)
    return None
