"""Vote repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.vote import Vote


class VoteRepository(ABC):
    """Abstract interface for vote persistence operations."""
    
    @abstractmethod
    async def get_by_id(self, vote_id: UUID) -> Optional[Vote]:
        """Get vote by ID."""
        pass
    
    @abstractmethod
    async def get_by_user_and_idea(
        self,
        user_id: UUID,
        idea_id: UUID
    ) -> Optional[Vote]:
        """Get vote by user and idea (unique constraint)."""
        pass
    
    @abstractmethod
    async def list_by_idea(
        self,
        idea_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Vote], int]:
        """List votes for an idea."""
        pass
    
    @abstractmethod
    async def get_average_stars(self, idea_id: UUID) -> float:
        """Get average star rating for an idea."""
        pass
    
    @abstractmethod
    async def get_vote_count(self, idea_id: UUID) -> int:
        """Get total vote count for an idea."""
        pass
    
    @abstractmethod
    async def create(self, vote: Vote) -> Vote:
        """Create new vote."""
        pass
    
    @abstractmethod
    async def update(self, vote: Vote) -> Vote:
        """Update existing vote."""
        pass
    
    @abstractmethod
    async def delete(self, vote_id: UUID) -> bool:
        """Delete vote."""
        pass
    
    @abstractmethod
    async def delete_by_idea(self, idea_id: UUID) -> bool:
        """Delete all votes for an idea."""
        pass

    @abstractmethod
    async def list_distinct_users_by_idea(self, idea_id: UUID) -> List[UUID]:
        """Get distinct user IDs who voted on an idea."""
        pass
