"""SQLAlchemy implementation of EventAward repositories."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_award import EventAward, EventAwardTeam
from app.domain.repositories.event_award_repository import (
    EventAwardRepository,
    EventAwardTeamRepository,
)
from app.infrastructure.database.models.event_award_model import (
    EventAwardModel,
    EventAwardTeamModel,
)


class SQLEventAwardRepository(EventAwardRepository):

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EventAwardModel) -> EventAward:
        return EventAward(
            id=UUID(model.id),
            event_id=UUID(model.event_id),
            name=model.name,
            rank_order=model.rank_order,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: EventAward) -> EventAwardModel:
        return EventAwardModel(
            id=str(entity.id),
            event_id=str(entity.event_id),
            name=entity.name,
            rank_order=entity.rank_order,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def get_by_id(self, award_id: UUID) -> Optional[EventAward]:
        result = await self.session.execute(
            select(EventAwardModel).where(EventAwardModel.id == str(award_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_event(self, event_id: UUID) -> List[EventAward]:
        result = await self.session.execute(
            select(EventAwardModel)
            .where(EventAwardModel.event_id == str(event_id))
            .order_by(asc(EventAwardModel.rank_order))
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def create(self, award: EventAward) -> EventAward:
        model = self._to_model(award)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def update(self, award: EventAward) -> EventAward:
        model = await self.session.get(EventAwardModel, str(award.id))
        if not model:
            raise ValueError(f"Award {award.id} not found")
        model.name = award.name
        model.rank_order = award.rank_order
        model.updated_at = award.updated_at
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def delete(self, award_id: UUID) -> None:
        model = await self.session.get(EventAwardModel, str(award_id))
        if model:
            await self.session.delete(model)
            await self.session.flush()
            await self.session.commit()


class SQLEventAwardTeamRepository(EventAwardTeamRepository):

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EventAwardTeamModel) -> EventAwardTeam:
        return EventAwardTeam(
            id=UUID(model.id),
            award_id=UUID(model.award_id),
            team_id=UUID(model.team_id),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def list_by_award(self, award_id: UUID) -> List[EventAwardTeam]:
        result = await self.session.execute(
            select(EventAwardTeamModel).where(
                EventAwardTeamModel.award_id == str(award_id)
            )
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_event(self, event_id: UUID) -> List[EventAwardTeam]:
        result = await self.session.execute(
            select(EventAwardTeamModel)
            .join(EventAwardModel, EventAwardTeamModel.award_id == EventAwardModel.id)
            .where(EventAwardModel.event_id == str(event_id))
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add_team(self, entry: EventAwardTeam) -> EventAwardTeam:
        model = EventAwardTeamModel(
            id=str(entry.id),
            award_id=str(entry.award_id),
            team_id=str(entry.team_id),
            created_at=entry.created_at,
            updated_at=entry.updated_at,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def remove_team(self, award_id: UUID, team_id: UUID) -> None:
        result = await self.session.execute(
            select(EventAwardTeamModel).where(
                EventAwardTeamModel.award_id == str(award_id),
                EventAwardTeamModel.team_id == str(team_id),
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self.session.delete(model)
            await self.session.flush()
            await self.session.commit()

    async def remove_all_by_award(self, award_id: UUID) -> None:
        result = await self.session.execute(
            select(EventAwardTeamModel).where(
                EventAwardTeamModel.award_id == str(award_id)
            )
        )
        for model in result.scalars().all():
            await self.session.delete(model)
        await self.session.flush()
        await self.session.commit()
