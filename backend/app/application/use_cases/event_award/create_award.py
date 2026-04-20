"""Create award use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.entities.event_award import EventAward
from app.domain.repositories.event_award_repository import EventAwardRepository
from app.domain.repositories.event_repository import EventRepository


class CreateAwardUseCase:

    def __init__(self, event_repo: EventRepository, award_repo: EventAwardRepository):
        self.event_repo = event_repo
        self.award_repo = award_repo

    async def execute(
        self,
        event_id: UUID,
        name: str,
        rank_order: int,
        is_admin: bool,
    ) -> EventAward:
        if not is_admin:
            raise ForbiddenException("Only Admin can manage awards")

        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        award = EventAward(
            event_id=event_id,
            name=name,
            rank_order=rank_order,
        )
        return await self.award_repo.create(award)
