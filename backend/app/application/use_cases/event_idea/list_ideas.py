"""List event ideas use case."""
from typing import Optional, Tuple
from uuid import UUID

from app.core.exceptions import NotFoundException
from app.domain.entities.event_idea import EventIdea
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_idea_repository import EventIdeaRepository


class ListEventIdeasUseCase:
    """List ideas in an event with filters."""

    def __init__(self, event_repo: EventRepository, idea_repo: EventIdeaRepository):
        self.event_repo = event_repo
        self.idea_repo = idea_repo

    async def execute(
        self,
        event_id: UUID,
        team_id: Optional[UUID] = None,
        sort: str = "newest",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[list[EventIdea], int]:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        return await self.idea_repo.list_by_event(event_id, team_id, sort, page, limit)
