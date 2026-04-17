"""EventScore repository interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.event_score import EventScore


class EventScoreRepository(ABC):

    @abstractmethod
    async def get_by_id(self, score_id: UUID) -> Optional[EventScore]:
        pass

    @abstractmethod
    async def get_by_idea_and_team(self, event_idea_id: UUID, scorer_team_id: UUID) -> Optional[EventScore]:
        pass

    @abstractmethod
    async def list_by_idea(self, event_idea_id: UUID) -> List[EventScore]:
        pass

    @abstractmethod
    async def create(self, score: EventScore) -> EventScore:
        pass

    @abstractmethod
    async def update(self, score: EventScore) -> EventScore:
        pass
