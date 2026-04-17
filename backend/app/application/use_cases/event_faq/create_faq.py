"""Create FAQ use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.entities.event_faq import EventFAQ
from app.domain.repositories.event_faq_repository import EventFAQRepository
from app.domain.repositories.event_repository import EventRepository


class CreateFAQUseCase:

    def __init__(self, event_repo: EventRepository, faq_repo: EventFAQRepository):
        self.event_repo = event_repo
        self.faq_repo = faq_repo

    async def execute(
        self,
        event_id: UUID,
        question: str,
        answer: str | None,
        sort_order: int | None,
        created_by: UUID,
        is_admin: bool,
        is_team_lead: bool,
    ) -> EventFAQ:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if not is_admin and not is_team_lead:
            raise ForbiddenException("Only Admin or Team Lead can create FAQs")

        if sort_order is None:
            max_order = await self.faq_repo.get_max_sort_order(event_id)
            sort_order = max_order + 1

        faq = EventFAQ(
            event_id=event_id,
            question=question,
            answer=answer,
            sort_order=sort_order,
            created_by=created_by,
        )
        return await self.faq_repo.create(faq)
