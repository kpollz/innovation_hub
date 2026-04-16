"""Update event team member status (approve/reject)."""
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class UpdateMemberStatusUseCase:
    """Team Lead approves or rejects a join request."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self,
        event_id: UUID,
        team_id: UUID,
        target_user_id: UUID,
        new_status: str,
        current_user_id: UUID,
        is_admin: bool = False,
    ):
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundException(f"Team {team_id} not found")

        if team.event_id != event_id:
            raise NotFoundException(f"Team {team_id} not found in event {event_id}")

        # Only team lead or admin can approve/reject
        if not is_admin and not team.is_leader(current_user_id):
            raise ForbiddenException("Only the team lead or admin can manage members")

        # Find the membership record
        members = await self.team_repo.get_team_members(team_id, status="pending")
        member = None
        for m in members:
            if m.user_id == target_user_id:
                member = m
                break

        if not member:
            raise NotFoundException(f"No pending request from user {target_user_id}")

        if new_status == "active":
            member.approve()
        elif new_status == "rejected":
            member.reject()
        else:
            raise ForbiddenException(f"Invalid status: {new_status}")

        return await self.team_repo.update_member(member)
