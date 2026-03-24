"""Idea endpoints."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status, Body

from app.application.dto.idea_dto import (
    CreateIdeaDTO,
    UpdateIdeaDTO,
    IdeaListFiltersDTO,
    IdeaResponseDTO,
    IdeaListResponseDTO,
)
from app.application.dto.vote_dto import CreateVoteDTO, VoteResponseDTO
from app.application.services.response_enrichment import enrich_idea, enrich_ideas
from app.application.use_cases.idea.create_idea import CreateIdeaUseCase
from app.application.use_cases.idea.update_idea import UpdateIdeaUseCase
from app.application.use_cases.idea.vote_idea import VoteIdeaUseCase
from app.application.services.notification_service import NotificationService
from app.infrastructure.database.repositories.idea_repository_impl import SQLIdeaRepository
from app.infrastructure.database.repositories.room_repository_impl import SQLRoomRepository
from app.infrastructure.database.repositories.vote_repository_impl import SQLVoteRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.database.repositories.reaction_repository_impl import SQLReactionRepository
from app.infrastructure.database.repositories.comment_repository_impl import SQLCommentRepository
from app.infrastructure.database.repositories.notification_repository_impl import SQLNotificationRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter()


async def _get_optional_user_id(request: Request) -> Optional[UUID]:
    """Extract user ID from token if present, without raising on missing auth."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "")
    try:
        from app.application.services.jwt_service import JWTService
        jwt_service = JWTService()
        payload = jwt_service.verify_token(token)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        return UUID(user_id) if user_id else None
    except Exception:
        return None


@router.get("", response_model=IdeaListResponseDTO)
async def list_ideas(
    request: Request,
    filters: IdeaListFiltersDTO = Depends(),
    page: int = 1,
    limit: int = 20,
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
):
    """List ideas with enriched data."""
    current_user_id = await _get_optional_user_id(request)
    ideas, total = await idea_repo.list(filters.model_dump(exclude_none=True), page, limit)
    items = await enrich_ideas(
        ideas, user_repo, reaction_repo, comment_repo, vote_repo, current_user_id
    )
    return IdeaListResponseDTO(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=IdeaResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_idea(
    data: CreateIdeaDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
):
    """Create a new idea."""
    use_case = CreateIdeaUseCase(idea_repo, room_repo)
    idea = await use_case.execute(data, current_user.id)
    return await enrich_idea(
        idea, user_repo, reaction_repo, comment_repo, vote_repo, current_user.id
    )


@router.get("/{idea_id}", response_model=IdeaResponseDTO)
async def get_idea(
    idea_id: UUID,
    request: Request,
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
):
    """Get an idea by ID with enriched data."""
    current_user_id = await _get_optional_user_id(request)
    idea = await idea_repo.get_by_id(idea_id)
    if not idea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")
    return await enrich_idea(
        idea, user_repo, reaction_repo, comment_repo, vote_repo, current_user_id
    )


@router.patch("/{idea_id}", response_model=IdeaResponseDTO)
async def update_idea(
    idea_id: UUID,
    data: UpdateIdeaDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
):
    """Update an idea."""
    # Get old status before update
    old_idea = await idea_repo.get_by_id(idea_id)
    old_status = old_idea.status if old_idea else None

    use_case = UpdateIdeaUseCase(idea_repo)
    idea = await use_case.execute(
        idea_id, data, current_user.id, current_user.role == "admin"
    )

    # Notify on status change
    if data.status and old_status and str(data.status) != str(old_status):
        svc = NotificationService(notification_repo, comment_repo, reaction_repo, vote_repo)
        await svc.notify(
            actor_id=current_user.id,
            target_id=idea_id,
            target_type="idea",
            target_title=idea.title,
            notification_type="status_changed",
            owner_id=idea.author_id,
        )

    return await enrich_idea(
        idea, user_repo, reaction_repo, comment_repo, vote_repo, current_user.id
    )


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_idea(
    idea_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
):
    """Delete an idea (author or admin only)."""
    idea = await idea_repo.get_by_id(idea_id)
    if not idea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")
    if idea.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    await idea_repo.delete(idea_id)
    return None


@router.post("/{idea_id}/votes", response_model=VoteResponseDTO, status_code=status.HTTP_201_CREATED)
async def vote_idea(
    idea_id: UUID,
    stars: int = Body(..., embed=True, ge=1, le=5),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    reaction_repo: SQLReactionRepository = Depends(deps.get_reaction_repo),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
):
    """Vote on an idea (1-5 stars). Creates or updates existing vote."""
    data = CreateVoteDTO(idea_id=idea_id, stars=stars)
    use_case = VoteIdeaUseCase(vote_repo, idea_repo)
    result = await use_case.execute(data, current_user.id)

    # Notify
    idea = await idea_repo.get_by_id(idea_id)
    if idea:
        svc = NotificationService(notification_repo, comment_repo, reaction_repo, vote_repo)
        await svc.notify(
            actor_id=current_user.id,
            target_id=idea_id,
            target_type="idea",
            target_title=idea.title,
            notification_type="vote_added",
            owner_id=idea.author_id,
        )

    return result


@router.delete("/{idea_id}/votes", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vote(
    idea_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    vote_repo: SQLVoteRepository = Depends(deps.get_vote_repo),
):
    """Remove current user's vote from an idea."""
    existing = await vote_repo.get_by_user_and_idea(current_user.id, idea_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No vote found")
    await vote_repo.delete(existing.id)
    return None
