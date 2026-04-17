"""Get event idea detail use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException
from app.domain.repositories.event_idea_repository import EventIdeaRepository


class GetEventIdeaUseCase:
    """Get a single idea by ID."""

    def __init__(self, idea_repo: EventIdeaRepository):
        self.idea_repo = idea_repo

    async def execute(self, idea_id: UUID):
        idea = await self.idea_repo.get_by_id(idea_id)
        if not idea:
            raise NotFoundException(f"Idea {idea_id} not found")
        return idea
