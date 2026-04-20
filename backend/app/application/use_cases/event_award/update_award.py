"""Update award use case."""
from uuid import UUID
from typing import Optional

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.event_award_repository import EventAwardRepository


class UpdateAwardUseCase:

    def __init__(self, award_repo: EventAwardRepository):
        self.award_repo = award_repo

    async def execute(
        self,
        award_id: UUID,
        name: Optional[str],
        rank_order: Optional[int],
        is_admin: bool,
    ) -> None:
        if not is_admin:
            raise ForbiddenException("Only Admin can manage awards")

        award = await self.award_repo.get_by_id(award_id)
        if not award:
            raise NotFoundException(f"Award {award_id} not found")

        award.update(name=name, rank_order=rank_order)
        await self.award_repo.update(award)
