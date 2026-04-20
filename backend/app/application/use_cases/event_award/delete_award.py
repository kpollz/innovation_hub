"""Delete award use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.event_award_repository import EventAwardRepository, EventAwardTeamRepository


class DeleteAwardUseCase:

    def __init__(
        self,
        award_repo: EventAwardRepository,
        award_team_repo: EventAwardTeamRepository,
    ):
        self.award_repo = award_repo
        self.award_team_repo = award_team_repo

    async def execute(self, award_id: UUID, is_admin: bool) -> None:
        if not is_admin:
            raise ForbiddenException("Only Admin can manage awards")

        award = await self.award_repo.get_by_id(award_id)
        if not award:
            raise NotFoundException(f"Award {award_id} not found")

        await self.award_team_repo.remove_all_by_award(award_id)
        await self.award_repo.delete(award_id)
