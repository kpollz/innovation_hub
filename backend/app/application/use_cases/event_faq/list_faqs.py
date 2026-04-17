"""List FAQs use case."""
from uuid import UUID

from app.domain.entities.event_faq import EventFAQ
from app.domain.repositories.event_faq_repository import EventFAQRepository
from app.domain.repositories.event_repository import EventRepository
from app.core.exceptions import NotFoundException


class ListFAQsUseCase:

    def __init__(self, event_repo: EventRepository, faq_repo: EventFAQRepository):
        self.event_repo = event_repo
        self.faq_repo = faq_repo

    async def execute(self, event_id: UUID) -> list[EventFAQ]:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        return await self.faq_repo.list_by_event(event_id)
