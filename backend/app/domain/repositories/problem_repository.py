"""Problem repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.problem import Problem


class ProblemRepository(ABC):
    """Abstract interface for problem persistence operations."""
    
    @abstractmethod
    async def get_by_id(self, problem_id: UUID) -> Optional[Problem]:
        """Get problem by ID."""
        pass
    
    @abstractmethod
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Problem], int]:
        """List problems with pagination. Returns (items, total_count)."""
        pass
    
    @abstractmethod
    async def get_by_room_id(self, room_id: UUID) -> Optional[Problem]:
        """Get problem linked to a room."""
        pass
    
    @abstractmethod
    async def create(self, problem: Problem) -> Problem:
        """Create new problem."""
        pass
    
    @abstractmethod
    async def update(self, problem: Problem) -> Problem:
        """Update existing problem."""
        pass
    
    @abstractmethod
    async def delete(self, problem_id: UUID) -> bool:
        """Delete problem."""
        pass
