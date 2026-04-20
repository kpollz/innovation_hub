"""Add team to award use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.domain.entities.event_award import EventAwardTeam
from app.domain.repositories.event_award_repository import EventAwardRepository, EventAwardTeamRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class AddTeamToAwardUseCase:

    def __init__(
        self,
        award_repo: EventAwardRepository,
        award_team_repo: EventAwardTeamRepository,
        team_repo: EventTeamRepository,
    ):
        self.award_repo = award_repo
        self.award_team_repo = award_team_repo
        self.team_repo = team_repo

    async def execute(
        self,
        award_id: UUID,
        team_id: UUID,
        is_admin: bool,
    ) -> None:
        if not is_admin:
            raise ForbiddenException("Only Admin can manage awards")

        award = await self.award_repo.get_by_id(award_id)
        if not award:
            raise NotFoundException(f"Award {award_id} not found")

        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundException(f"Team {team_id} not found")

        if str(team.event_id) != str(award.event_id):
            raise ConflictException("Team does not belong to this event")

        # Check team not already assigned to any award in this event
        existing = await self.award_team_repo.list_by_event(award.event_id)
        for at in existing:
            if at.team_id == team_id:
                raise ConflictException("Team is already assigned to an award in this event")

        entry = EventAwardTeam(award_id=award_id, team_id=team_id)
        await self.award_team_repo.add_team(entry)
