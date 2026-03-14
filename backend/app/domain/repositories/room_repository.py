"""Room repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.room import Room


class RoomRepository(ABC):
    """Abstract interface for room persistence operations."""
    
    @abstractmethod
    async def get_by_id(self, room_id: UUID) -> Optional[Room]:
        """Get room by ID."""
        pass
    
    @abstractmethod
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Room], int]:
        """List rooms with pagination. Returns (items, total_count)."""
        pass
    
    @abstractmethod
    async def get_by_problem_id(self, problem_id: UUID) -> Optional[Room]:
        """Get room linked to a problem."""
        pass
    
    @abstractmethod
    async def create(self, room: Room) -> Room:
        """Create new room."""
        pass
    
    @abstractmethod
    async def update(self, room: Room) -> Room:
        """Update existing room."""
        pass
    
    @abstractmethod
    async def delete(self, room_id: UUID) -> bool:
        """Delete room."""
        pass
