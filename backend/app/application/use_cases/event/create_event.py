"""Create event use case."""
from uuid import UUID

from app.application.dto.event_dto import CreateEventDTO
from app.core.exceptions import ForbiddenException
from app.domain.entities.event import Event
from app.domain.repositories.event_repository import EventRepository


class CreateEventUseCase:
    """Use case: Create a new event (Admin only)."""

    def __init__(self, event_repo: EventRepository):
        self.event_repo = event_repo

    async def execute(
        self,
        dto: CreateEventDTO,
        creator_id: UUID,
        is_admin: bool = False,
    ) -> Event:
        """Create a new event and return the domain entity."""
        if not is_admin:
            raise ForbiddenException("Only admins can create events")

        event = Event(
            title=dto.title,
            description=dto.description,
            introduction_type=dto.introduction_type,
            embed_url=dto.embed_url,
            status=dto.status,
            start_date=dto.start_date,
            end_date=dto.end_date,
            created_by=creator_id,
        )
        event.validate_introduction()
        return await self.event_repo.create(event)
