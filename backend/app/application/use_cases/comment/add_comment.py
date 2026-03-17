"""Add comment use case."""
from uuid import UUID

from app.application.dto.comment_dto import CreateCommentDTO
from app.domain.entities.comment import Comment
from app.domain.repositories.comment_repository import CommentRepository


class AddCommentUseCase:
    """Use case: Add a comment to a problem or idea."""

    def __init__(self, comment_repo: CommentRepository):
        self.comment_repo = comment_repo

    async def execute(self, dto: CreateCommentDTO, author_id: UUID) -> Comment:
        """Create a comment and return the domain entity."""
        comment = Comment(
            target_id=dto.target_id,
            target_type=dto.target_type,
            content=dto.content,
            author_id=author_id,
            parent_id=dto.parent_id,
        )
        return await self.comment_repo.create(comment)
