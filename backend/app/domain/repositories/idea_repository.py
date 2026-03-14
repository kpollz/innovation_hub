"""Idea repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.idea import Idea


class IdeaRepository(ABC):
    """Abstract interface for idea persistence operations."""
    
    @abstractmethod
    async def get_by_id(self, idea_id: UUID) -> Optional[Idea]:
        """Get idea by ID."""
        pass
    
    @abstractmethod
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Idea], int]:
        """List ideas with pagination. Returns (items, total_count)."""
        pass
    
    @abstractmethod
    async def list_by_room_id(
        self,
        room_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Idea], int]:
        """List ideas in a specific room."""
        pass
    
    @abstractmethod
    async def list_by_author_id(
        self,
        author_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Idea], int]:
        """List ideas by a specific author."""
        pass
    
    @abstractmethod
    async def create(self, idea: Idea) -> Idea:
        """Create new idea."""
        pass
    
    @abstractmethod
    async def update(self, idea: Idea) -> Idea:
        """Update existing idea."""
        pass
    
    @abstractmethod
    async def delete(self, idea_id: UUID) -> bool:
        """Delete idea."""
        pass
