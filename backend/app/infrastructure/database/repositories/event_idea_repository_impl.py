"""SQLAlchemy implementation of EventIdeaRepository."""
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select, desc, asc, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_idea import EventIdea
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.infrastructure.database.models.event_idea_model import EventIdeaModel


class SQLEventIdeaRepository(EventIdeaRepository):
    """SQLAlchemy implementation of EventIdeaRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EventIdeaModel) -> EventIdea:
        return EventIdea(
            id=UUID(model.id),
            event_id=UUID(model.event_id),
            team_id=UUID(model.team_id),
            title=model.title,
            user_problem=model.user_problem,
            user_scenarios=model.user_scenarios,
            user_expectation=model.user_expectation,
            research=model.research,
            solution=model.solution,
            source_type=model.source_type,
            source_problem_id=UUID(model.source_problem_id) if model.source_problem_id else None,
            source_room_id=UUID(model.source_room_id) if model.source_room_id else None,
            source_idea_id=UUID(model.source_idea_id) if model.source_idea_id else None,
            author_id=UUID(model.author_id),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: EventIdea) -> EventIdeaModel:
        return EventIdeaModel(
            id=str(entity.id),
            event_id=str(entity.event_id),
            team_id=str(entity.team_id),
            title=entity.title,
            user_problem=entity.user_problem,
            user_scenarios=entity.user_scenarios,
            user_expectation=entity.user_expectation,
            research=entity.research,
            solution=entity.solution,
            source_type=entity.source_type,
            source_problem_id=str(entity.source_problem_id) if entity.source_problem_id else None,
            source_room_id=str(entity.source_room_id) if entity.source_room_id else None,
            source_idea_id=str(entity.source_idea_id) if entity.source_idea_id else None,
            author_id=str(entity.author_id),
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def get_by_id(self, idea_id: UUID) -> Optional[EventIdea]:
        result = await self.session.execute(
            select(EventIdeaModel).where(EventIdeaModel.id == str(idea_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_event(
        self,
        event_id: UUID,
        team_id: Optional[UUID] = None,
        sort: str = "newest",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[EventIdea], int]:
        query = select(EventIdeaModel).where(
            EventIdeaModel.event_id == str(event_id)
        )

        if team_id:
            query = query.where(EventIdeaModel.team_id == str(team_id))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        # Sort
        if sort == "score":
            # Nulls last: COALESCE would need total_score column which doesn't exist yet
            # For now, sort by newest since scoring isn't implemented
            query = query.order_by(desc(EventIdeaModel.created_at))
        else:
            query = query.order_by(desc(EventIdeaModel.created_at))

        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)

        result = await self.session.execute(query)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models], total

    async def create(self, idea: EventIdea) -> EventIdea:
        model = self._to_model(idea)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def update(self, idea: EventIdea) -> EventIdea:
        model = await self.session.get(EventIdeaModel, str(idea.id))
        if not model:
            raise ValueError(f"Idea {idea.id} not found")

        model.title = idea.title
        model.user_problem = idea.user_problem
        model.user_scenarios = idea.user_scenarios
        model.user_expectation = idea.user_expectation
        model.research = idea.research
        model.solution = idea.solution
        model.updated_at = idea.updated_at

        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def count_by_event(self, event_id: UUID) -> int:
        result = await self.session.scalar(
            select(func.count()).where(
                EventIdeaModel.event_id == str(event_id)
            )
        )
        return result or 0

    async def count_by_team(self, team_id: UUID) -> int:
        result = await self.session.scalar(
            select(func.count()).where(
                EventIdeaModel.team_id == str(team_id)
            )
        )
        return result or 0

    async def delete(self, idea_id: UUID) -> bool:
        model = await self.session.get(EventIdeaModel, str(idea_id))
        if not model:
            return False
        await self.session.delete(model)
        await self.session.flush()
        return True
