"""Create event team use case."""
from uuid import UUID

from app.application.dto.event_team_dto import CreateEventTeamDTO
from app.core.exceptions import ForbiddenException, NotFoundException, ConflictException
from app.domain.entities.event_team import EventTeam, EventTeamMember
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class CreateEventTeamUseCase:
    """Create a team in an event. Creator becomes Team Lead."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self, event_id: UUID, dto: CreateEventTeamDTO, user_id: UUID
    ) -> EventTeam:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if not event.is_active():
            raise ForbiddenException("Cannot create team: event is not active")

        # Check user is not already in a team for this event
        existing = await self.team_repo.get_member_by_user_and_event(user_id, event_id)
        if existing and existing.status in ("pending", "active"):
            raise ConflictException("You are already in a team for this event")

        # Create team
        team = EventTeam(
            event_id=event_id,
            name=dto.name,
            slogan=dto.slogan,
            leader_id=user_id,
        )
        team = await self.team_repo.create_team(team)

        # Auto-add creator as active member
        member = EventTeamMember(
            team_id=team.id,
            user_id=user_id,
            event_id=event_id,
            status="active",
        )
        await self.team_repo.add_member(member)

        return team
