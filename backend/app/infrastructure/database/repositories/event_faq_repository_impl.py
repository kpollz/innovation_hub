"""SQLAlchemy implementation of EventFAQRepository."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, select, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_faq import EventFAQ
from app.domain.repositories.event_faq_repository import EventFAQRepository
from app.infrastructure.database.models.event_faq_model import EventFAQModel


class SQLEventFAQRepository(EventFAQRepository):

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EventFAQModel) -> EventFAQ:
        return EventFAQ(
            id=UUID(model.id),
            event_id=UUID(model.event_id),
            question=model.question,
            answer=model.answer,
            sort_order=model.sort_order,
            created_by=UUID(model.created_by),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: EventFAQ) -> EventFAQModel:
        return EventFAQModel(
            id=str(entity.id),
            event_id=str(entity.event_id),
            question=entity.question,
            answer=entity.answer,
            sort_order=entity.sort_order,
            created_by=str(entity.created_by),
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def get_by_id(self, faq_id: UUID) -> Optional[EventFAQ]:
        result = await self.session.execute(
            select(EventFAQModel).where(EventFAQModel.id == str(faq_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_event(self, event_id: UUID) -> List[EventFAQ]:
        result = await self.session.execute(
            select(EventFAQModel)
            .where(EventFAQModel.event_id == str(event_id))
            .order_by(asc(EventFAQModel.sort_order), asc(EventFAQModel.created_at))
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def create(self, faq: EventFAQ) -> EventFAQ:
        model = self._to_model(faq)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def update(self, faq: EventFAQ) -> EventFAQ:
        model = await self.session.get(EventFAQModel, str(faq.id))
        if not model:
            raise ValueError(f"FAQ {faq.id} not found")

        model.question = faq.question
        model.answer = faq.answer
        model.sort_order = faq.sort_order
        model.updated_at = faq.updated_at

        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def delete(self, faq_id: UUID) -> None:
        model = await self.session.get(EventFAQModel, str(faq_id))
        if model:
            await self.session.delete(model)
            await self.session.flush()

    async def get_max_sort_order(self, event_id: UUID) -> int:
        result = await self.session.scalar(
            select(func.coalesce(func.max(EventFAQModel.sort_order), -1)).where(
                EventFAQModel.event_id == str(event_id)
            )
        )
        return result if result is not None else -1
