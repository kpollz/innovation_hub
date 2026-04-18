"""Event Idea repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.event_idea import EventIdea


class EventIdeaRepository(ABC):
    """Abstract interface for event idea persistence operations."""

    @abstractmethod
    async def get_by_id(self, idea_id: UUID) -> Optional[EventIdea]:
        pass

    @abstractmethod
    async def list_by_event(
        self,
        event_id: UUID,
        team_id: Optional[UUID] = None,
        sort: str = "newest",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[EventIdea], int]:
        pass

    @abstractmethod
    async def create(self, idea: EventIdea) -> EventIdea:
        pass

    @abstractmethod
    async def update(self, idea: EventIdea) -> EventIdea:
        pass

    @abstractmethod
    async def count_by_event(self, event_id: UUID) -> int:
        pass

    @abstractmethod
    async def count_by_team(self, team_id: UUID) -> int:
        pass

    @abstractmethod
    async def delete(self, idea_id: UUID) -> bool:
        pass
