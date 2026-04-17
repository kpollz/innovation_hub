"""EventFAQ repository interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.event_faq import EventFAQ


class EventFAQRepository(ABC):

    @abstractmethod
    async def get_by_id(self, faq_id: UUID) -> Optional[EventFAQ]:
        ...

    @abstractmethod
    async def list_by_event(self, event_id: UUID) -> List[EventFAQ]:
        ...

    @abstractmethod
    async def create(self, faq: EventFAQ) -> EventFAQ:
        ...

    @abstractmethod
    async def update(self, faq: EventFAQ) -> EventFAQ:
        ...

    @abstractmethod
    async def delete(self, faq_id: UUID) -> None:
        ...

    @abstractmethod
    async def get_max_sort_order(self, event_id: UUID) -> int:
        ...
