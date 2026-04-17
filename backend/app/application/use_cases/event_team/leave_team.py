"""Leave event team use case."""
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class LeaveEventTeamUseCase:
    """Member leaves their team. Team Lead cannot leave (must transfer or disband)."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self, event_id: UUID, team_id: UUID, user_id: UUID
    ):
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if not event.is_active():
            raise ForbiddenException("Cannot leave team: event is not active")

        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundException(f"Team {team_id} not found")

        if team.event_id != event_id:
            raise NotFoundException(f"Team {team_id} not found in event {event_id}")

        # Team Lead cannot leave
        if team.is_leader(user_id):
            raise ForbiddenException(
                "Team Lead cannot leave. Transfer leadership first or disband the team."
            )

        # Find any membership (active or pending) — allows canceling join requests too
        member = await self.team_repo.get_member_by_user_and_team(user_id, team_id)
        if not member:
            raise NotFoundException("You are not a member of this team")

        await self.team_repo.remove_member(member.id)
