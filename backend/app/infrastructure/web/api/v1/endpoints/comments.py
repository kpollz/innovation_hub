"""Comment endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.comment_dto import (
    CreateCommentDTO,
    UpdateCommentDTO,
    CommentResponseDTO,
    CommentListResponseDTO,
)
from app.application.services.response_enrichment import enrich_comment, enrich_comments
from app.application.use_cases.comment.add_comment import AddCommentUseCase
from app.application.use_cases.comment.delete_comment import DeleteCommentUseCase
from app.infrastructure.database.repositories.comment_repository_impl import SQLCommentRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("", response_model=CommentListResponseDTO)
async def list_comments(
    target_id: UUID,
    target_type: str,
    page: int = 1,
    limit: int = 20,
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """List comments for a target with author info."""
    comments, total = await comment_repo.list_by_target(target_id, target_type, page, limit)
    items = await enrich_comments(comments, user_repo)
    return CommentListResponseDTO(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=CommentResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_comment(
    data: CreateCommentDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Create a new comment."""
    use_case = AddCommentUseCase(comment_repo)
    comment = await use_case.execute(data, current_user.id)
    return await enrich_comment(comment, user_repo)


@router.patch("/{comment_id}", response_model=CommentResponseDTO)
async def update_comment(
    comment_id: UUID,
    data: UpdateCommentDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Update a comment."""
    comment = await comment_repo.get_by_id(comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own comments",
        )

    comment.update_content(data.content)
    updated = await comment_repo.update(comment)
    return await enrich_comment(updated, user_repo)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
):
    """Delete a comment."""
    use_case = DeleteCommentUseCase(comment_repo)
    success = await use_case.execute(
        comment_id, current_user.id, current_user.role == "admin"
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return None
