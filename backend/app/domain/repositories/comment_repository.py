"""Comment repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.comment import Comment


class CommentRepository(ABC):
    """Abstract interface for comment persistence operations."""
    
    @abstractmethod
    async def get_by_id(self, comment_id: UUID) -> Optional[Comment]:
        """Get comment by ID."""
        pass
    
    @abstractmethod
    async def list_by_target(
        self,
        target_id: UUID,
        target_type: str,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Comment], int]:
        """List comments for a target (problem or idea)."""
        pass
    
    @abstractmethod
    async def list_replies(
        self,
        parent_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Comment], int]:
        """List replies to a comment."""
        pass
    
    @abstractmethod
    async def create(self, comment: Comment) -> Comment:
        """Create new comment."""
        pass
    
    @abstractmethod
    async def update(self, comment: Comment) -> Comment:
        """Update existing comment."""
        pass
    
    @abstractmethod
    async def delete(self, comment_id: UUID) -> bool:
        """Delete comment."""
        pass
    
    @abstractmethod
    async def delete_by_target(self, target_id: UUID, target_type: str) -> bool:
        """Delete all comments for a target."""
        pass

    @abstractmethod
    async def list_distinct_authors_by_target(
        self, target_id: UUID, target_type: str
    ) -> List[UUID]:
        """Get distinct author IDs who commented on a target."""
        pass
