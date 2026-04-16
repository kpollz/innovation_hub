"""Join event team use case."""
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException, ConflictException
from app.domain.entities.event_team import EventTeamMember
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class JoinEventTeamUseCase:
    """Request to join a team."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self, event_id: UUID, team_id: UUID, user_id: UUID
    ) -> EventTeamMember:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if not event.is_active():
            raise ForbiddenException("Cannot join team: event is not active")

        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundException(f"Team {team_id} not found")

        if team.event_id != event_id:
            raise NotFoundException(f"Team {team_id} not found in event {event_id}")

        # Check user is not already in a team for this event
        existing = await self.team_repo.get_member_by_user_and_event(user_id, event_id)
        if existing:
            if existing.status == "pending":
                raise ConflictException("You already have a pending join request for this event")
            if existing.status == "active":
                raise ConflictException("You are already in a team for this event")

        # Create pending membership
        member = EventTeamMember(
            team_id=team_id,
            user_id=user_id,
            event_id=event_id,
            status="pending",
        )
        return await self.team_repo.add_member(member)
