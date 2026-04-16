"""Event repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.event import Event


class EventRepository(ABC):
    """Abstract interface for event persistence operations."""

    @abstractmethod
    async def get_by_id(self, event_id: UUID) -> Optional[Event]:
        """Get event by ID."""
        pass

    @abstractmethod
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Event], int]:
        """List events with pagination. Returns (items, total_count)."""
        pass

    @abstractmethod
    async def create(self, event: Event) -> Event:
        """Create new event."""
        pass

    @abstractmethod
    async def update(self, event: Event) -> Event:
        """Update existing event."""
        pass

    @abstractmethod
    async def delete(self, event_id: UUID) -> bool:
        """Delete event."""
        pass

    @abstractmethod
    async def get_team_count(self, event_id: UUID) -> int:
        """Get number of teams in an event."""
        pass

    @abstractmethod
    async def get_idea_count(self, event_id: UUID) -> int:
        """Get number of ideas in an event."""
        pass
