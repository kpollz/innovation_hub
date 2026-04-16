"""List event teams use case."""
from typing import Tuple
from uuid import UUID

from app.core.exceptions import NotFoundException
from app.domain.entities.event_team import EventTeam
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class ListEventTeamsUseCase:
    """List teams in an event."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self, event_id: UUID, page: int = 1, limit: int = 20
    ) -> Tuple[list[EventTeam], int]:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        return await self.team_repo.list_teams_by_event(event_id, page, limit)
