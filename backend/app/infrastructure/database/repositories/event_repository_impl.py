"""SQLAlchemy implementation of EventRepository."""
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import Date, DateTime, func, select, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event import Event
from app.domain.repositories.event_repository import EventRepository
from app.domain.value_objects.status import EventStatus
from app.infrastructure.database.models.event_model import EventModel


class SQLEventRepository(EventRepository):
    """SQLAlchemy implementation of EventRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EventModel) -> Event:
        """Map ORM model to domain entity."""
        return Event(
            id=UUID(model.id),
            title=model.title,
            description=model.description,
            introduction_type=model.introduction_type,
            embed_url=model.embed_url,
            status=EventStatus(model.status),
            start_date=model.start_date,
            end_date=model.end_date,
            created_by=UUID(model.created_by),
            created_at=model.created_at,
            updated_at=model.updated_at,
            closed_at=model.closed_at,
        )

    def _to_model(self, entity: Event) -> EventModel:
        """Map domain entity to ORM model."""
        return EventModel(
            id=str(entity.id),
            title=entity.title,
            description=entity.description,
            introduction_type=entity.introduction_type,
            embed_url=entity.embed_url,
            status=entity.status.value,
            start_date=entity.start_date,
            end_date=entity.end_date,
            created_by=str(entity.created_by),
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            closed_at=entity.closed_at,
        )

    async def get_by_id(self, event_id: UUID) -> Optional[Event]:
        result = await self.session.execute(
            select(EventModel).where(EventModel.id == str(event_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Event], int]:
        query = select(EventModel)

        # Apply filters
        if filters:
            if filters.get("status"):
                query = query.where(EventModel.status == filters["status"])

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        # Sort by newest first
        query = query.order_by(desc(EventModel.created_at))

        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)

        result = await self.session.execute(query)
        models = result.scalars().all()

        return [self._to_entity(m) for m in models], total

    async def create(self, event: Event) -> Event:
        model = self._to_model(event)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def update(self, event: Event) -> Event:
        model = await self.session.get(EventModel, str(event.id))
        if not model:
            raise ValueError(f"Event {event.id} not found")

        model.title = event.title
        model.description = event.description
        model.introduction_type = event.introduction_type
        model.embed_url = event.embed_url
        model.status = event.status.value
        model.start_date = event.start_date
        model.end_date = event.end_date
        model.updated_at = event.updated_at
        model.closed_at = event.closed_at

        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def delete(self, event_id: UUID) -> bool:
        model = await self.session.get(EventModel, str(event_id))
        if not model:
            return False

        await self.session.delete(model)
        await self.session.flush()
        return True

    async def get_team_count(self, event_id: UUID) -> int:
        """Get number of teams in an event."""
        from app.infrastructure.database.models.event_team_model import EventTeamModel
        result = await self.session.scalar(
            select(func.count()).where(EventTeamModel.event_id == str(event_id))
        )
        return result or 0

    async def get_idea_count(self, event_id: UUID) -> int:
        """Get number of ideas in an event."""
        try:
            from app.infrastructure.database.models.event_idea_model import EventIdeaModel
            result = await self.session.scalar(
                select(func.count()).where(EventIdeaModel.event_id == str(event_id))
            )
            return result or 0
        except ImportError:
            return 0
