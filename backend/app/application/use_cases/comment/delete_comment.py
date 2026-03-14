"""Delete comment use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.comment_repository import CommentRepository


class DeleteCommentUseCase:
    """Use case: Delete a comment."""
    
    def __init__(self, comment_repo: CommentRepository):
        self.comment_repo = comment_repo
    
    async def execute(
        self,
        comment_id: UUID,
        current_user_id: UUID,
        is_admin: bool = False
    ) -> bool:
        """Execute the use case."""
        comment = await self.comment_repo.get_by_id(comment_id)
        if not comment:
            raise NotFoundException(f"Comment {comment_id} not found")
        
        # Authorization check
        if comment.author_id != current_user_id and not is_admin:
            raise ForbiddenException("You can only delete your own comments")
        
        return await self.comment_repo.delete(comment_id)
