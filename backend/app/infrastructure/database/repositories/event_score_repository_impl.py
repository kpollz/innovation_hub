"""SQLAlchemy implementation of EventScoreRepository."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_score import EventScore
from app.domain.repositories.event_score_repository import EventScoreRepository
from app.infrastructure.database.models.event_score_model import EventScoreModel


class SQLEventScoreRepository(EventScoreRepository):

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EventScoreModel) -> EventScore:
        return EventScore(
            id=UUID(model.id),
            event_idea_id=UUID(model.event_idea_id),
            scorer_team_id=UUID(model.scorer_team_id),
            criteria_scores=model.criteria_scores,
            total_score=model.total_score,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model_values(self, entity: EventScore) -> dict:
        return {
            "id": str(entity.id),
            "event_idea_id": str(entity.event_idea_id),
            "scorer_team_id": str(entity.scorer_team_id),
            "criteria_scores": entity.criteria_scores,
            "total_score": entity.total_score,
            "created_at": entity.created_at,
            "updated_at": entity.updated_at,
        }

    async def get_by_id(self, score_id: UUID) -> Optional[EventScore]:
        result = await self.session.execute(
            select(EventScoreModel).where(EventScoreModel.id == str(score_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_idea_and_team(self, event_idea_id: UUID, scorer_team_id: UUID) -> Optional[EventScore]:
        result = await self.session.execute(
            select(EventScoreModel).where(
                EventScoreModel.event_idea_id == str(event_idea_id),
                EventScoreModel.scorer_team_id == str(scorer_team_id),
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_idea(self, event_idea_id: UUID) -> List[EventScore]:
        result = await self.session.execute(
            select(EventScoreModel).where(
                EventScoreModel.event_idea_id == str(event_idea_id)
            )
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def create(self, score: EventScore) -> EventScore:
        model = EventScoreModel(**self._to_model_values(score))
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def update(self, score: EventScore) -> EventScore:
        model = await self.session.get(EventScoreModel, str(score.id))
        if not model:
            raise ValueError(f"Score {score.id} not found")

        model.criteria_scores = score.criteria_scores
        model.total_score = score.total_score
        model.updated_at = datetime.utcnow()

        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
