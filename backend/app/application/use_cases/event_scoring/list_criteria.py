"""List scoring criteria use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException
from app.domain.entities.event_scoring_criteria import EventScoringCriteria
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_scoring_criteria_repository import EventScoringCriteriaRepository


class ListCriteriaUseCase:

    def __init__(
        self,
        event_repo: EventRepository,
        criteria_repo: EventScoringCriteriaRepository,
    ):
        self.event_repo = event_repo
        self.criteria_repo = criteria_repo

    async def execute(self, event_id: UUID) -> list[EventScoringCriteria]:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        return await self.criteria_repo.list_by_event(event_id)
