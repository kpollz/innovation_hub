"""Update FAQ use case."""
from uuid import UUID
from typing import Optional

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.event_faq_repository import EventFAQRepository


class UpdateFAQUseCase:

    def __init__(self, faq_repo: EventFAQRepository):
        self.faq_repo = faq_repo

    async def execute(
        self,
        faq_id: UUID,
        question: Optional[str],
        answer: Optional[str],
        sort_order: Optional[int],
        user_id: UUID,
        is_admin: bool,
    ) -> dict:
        faq = await self.faq_repo.get_by_id(faq_id)
        if not faq:
            raise NotFoundException(f"FAQ {faq_id} not found")

        if not is_admin and str(faq.created_by) != str(user_id):
            raise ForbiddenException("Only the author or Admin can update this FAQ")

        faq.update(question=question, answer=answer, sort_order=sort_order)
        updated = await self.faq_repo.update(faq)
        return updated
