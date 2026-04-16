"""Transfer team leadership use case."""
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class TransferTeamLeadUseCase:
    """Transfer team leadership to another active member."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self,
        event_id: UUID,
        team_id: UUID,
        new_leader_id: UUID,
        current_user_id: UUID,
        is_admin: bool = False,
    ):
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if not event.is_active():
            raise ForbiddenException("Cannot transfer lead: event is not active")

        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundException(f"Team {team_id} not found")

        if team.event_id != event_id:
            raise NotFoundException(f"Team {team_id} not found in event {event_id}")

        # Only current leader or admin can transfer
        if not is_admin and not team.is_leader(current_user_id):
            raise ForbiddenException("Only the current team lead or admin can transfer leadership")

        if new_leader_id == current_user_id:
            raise ForbiddenException("Cannot transfer leadership to yourself")

        # Verify new leader is an active member
        new_leader_member = await self.team_repo.get_active_member_by_user_and_team(
            new_leader_id, team_id
        )
        if not new_leader_member:
            raise ForbiddenException("New leader must be an active member of this team")

        # Transfer
        team.leader_id = new_leader_id
        team.updated_at = __import__("datetime").datetime.utcnow()
        return await self.team_repo.update_team(team)
