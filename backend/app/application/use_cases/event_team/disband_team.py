"""Disband event team use case."""
from uuid import UUID
from typing import List

from app.core.exceptions import ForbiddenException, NotFoundException
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class DisbandEventTeamUseCase:
    """Team Lead disbands their team. Cascade deletes members."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self,
        event_id: UUID,
        team_id: UUID,
        current_user_id: UUID,
        is_admin: bool = False,
    ) -> List[UUID]:
        """Returns list of team IDs affected by review assignment cleanup."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if event.is_closed():
            raise ForbiddenException("Cannot disband team: event is closed")

        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundException(f"Team {team_id} not found")

        if team.event_id != event_id:
            raise NotFoundException(f"Team {team_id} not found in event {event_id}")

        # Only team lead or admin can disband
        if not is_admin and not team.is_leader(current_user_id):
            raise ForbiddenException("Only the team lead or admin can disband a team")

        # Clear review assignments before deleting
        affected_team_ids = await self.team_repo.clear_review_assignments_for_team(team_id)

        # Delete team (cascade deletes members)
        await self.team_repo.delete_team(team_id)

        return affected_team_ids
