"""SQLAlchemy implementation of EventScoringCriteriaRepository."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_scoring_criteria import EventScoringCriteria
from app.domain.repositories.event_scoring_criteria_repository import EventScoringCriteriaRepository
from app.infrastructure.database.models.event_scoring_criteria_model import EventScoringCriteriaModel


class SQLEventScoringCriteriaRepository(EventScoringCriteriaRepository):

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EventScoringCriteriaModel) -> EventScoringCriteria:
        return EventScoringCriteria(
            id=UUID(model.id),
            event_id=UUID(model.event_id),
            group=model.group,
            name=model.name,
            description=model.description,
            weight=model.weight,
            max_score=model.max_score,
            sort_order=model.sort_order,
            created_at=model.created_at,
        )

    def _to_model(self, entity: EventScoringCriteria) -> EventScoringCriteriaModel:
        return EventScoringCriteriaModel(
            id=str(entity.id),
            event_id=str(entity.event_id),
            group=entity.group,
            name=entity.name,
            description=entity.description,
            weight=entity.weight,
            max_score=entity.max_score,
            sort_order=entity.sort_order,
            created_at=entity.created_at,
        )

    async def get_by_id(self, criteria_id: UUID) -> Optional[EventScoringCriteria]:
        result = await self.session.execute(
            select(EventScoringCriteriaModel).where(
                EventScoringCriteriaModel.id == str(criteria_id)
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_event(self, event_id: UUID) -> List[EventScoringCriteria]:
        result = await self.session.execute(
            select(EventScoringCriteriaModel)
            .where(EventScoringCriteriaModel.event_id == str(event_id))
            .order_by(asc(EventScoringCriteriaModel.group), asc(EventScoringCriteriaModel.sort_order))
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def create(self, criteria: EventScoringCriteria) -> EventScoringCriteria:
        model = self._to_model(criteria)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def create_batch(self, criteria_list: List[EventScoringCriteria]) -> List[EventScoringCriteria]:
        models = [self._to_model(c) for c in criteria_list]
        self.session.add_all(models)
        await self.session.flush()
        for model in models:
            await self.session.refresh(model)
        return [self._to_entity(m) for m in models]

    async def exists_for_event(self, event_id: UUID) -> bool:
        from sqlalchemy import func
        result = await self.session.scalar(
            select(func.count()).select_from(EventScoringCriteriaModel).where(
                EventScoringCriteriaModel.event_id == str(event_id)
            )
        )
        return (result or 0) > 0
