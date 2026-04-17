"""EventScoringCriteria repository interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.event_scoring_criteria import EventScoringCriteria


class EventScoringCriteriaRepository(ABC):

    @abstractmethod
    async def get_by_id(self, criteria_id: UUID) -> Optional[EventScoringCriteria]:
        pass

    @abstractmethod
    async def list_by_event(self, event_id: UUID) -> List[EventScoringCriteria]:
        pass

    @abstractmethod
    async def create(self, criteria: EventScoringCriteria) -> EventScoringCriteria:
        pass

    @abstractmethod
    async def create_batch(self, criteria_list: List[EventScoringCriteria]) -> List[EventScoringCriteria]:
        pass

    @abstractmethod
    async def exists_for_event(self, event_id: UUID) -> bool:
        pass
