"""Delete event idea use case."""
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class DeleteEventIdeaUseCase:
    """Delete an idea. Author, team lead of the idea's team, or admin."""

    def __init__(
        self,
        event_repo: EventRepository,
        team_repo: EventTeamRepository,
        idea_repo: EventIdeaRepository,
    ):
        self.event_repo = event_repo
        self.team_repo = team_repo
        self.idea_repo = idea_repo

    async def execute(
        self,
        event_id: UUID,
        idea_id: UUID,
        user_id: UUID,
        is_admin: bool = False,
    ) -> None:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if event.is_closed():
            raise ForbiddenException("Cannot delete idea: event is closed")

        idea = await self.idea_repo.get_by_id(idea_id)
        if not idea:
            raise NotFoundException(f"Idea {idea_id} not found")

        if idea.event_id != event_id:
            raise NotFoundException(f"Idea {idea_id} not found in event {event_id}")

        # Permission: author, team lead of the idea's team, or admin
        is_author = idea.author_id == user_id
        team = await self.team_repo.get_team_by_id(idea.team_id)
        is_team_lead = team and team.is_leader(user_id)

        if not is_admin and not is_author and not is_team_lead:
            raise ForbiddenException("Only the author, team lead, or admin can delete this idea")

        await self.idea_repo.delete(idea_id)
