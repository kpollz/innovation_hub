"""Update event use case."""
from uuid import UUID

from app.application.dto.event_dto import UpdateEventDTO
from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.entities.event import Event
from app.domain.repositories.event_repository import EventRepository


class UpdateEventUseCase:
    """Use case: Update an existing event (Admin only)."""

    def __init__(self, event_repo: EventRepository):
        self.event_repo = event_repo

    async def execute(
        self,
        event_id: UUID,
        dto: UpdateEventDTO,
        current_user_id: UUID,
        is_admin: bool = False,
    ) -> Event:
        """Update and return the domain entity."""
        if not is_admin:
            raise ForbiddenException("Only admins can update events")

        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if event.is_closed():
            raise ForbiddenException("Cannot update a closed event")

        # Build updated fields
        update_kwargs = {}
        if dto.title is not None:
            update_kwargs["title"] = dto.title
        if dto.description is not None:
            update_kwargs["description"] = dto.description
        if dto.embed_url is not None:
            update_kwargs["embed_url"] = dto.embed_url
        if dto.introduction_type is not None:
            update_kwargs["introduction_type"] = dto.introduction_type
        if dto.start_date is not None:
            update_kwargs["start_date"] = dto.start_date
        if dto.end_date is not None:
            update_kwargs["end_date"] = dto.end_date
        if dto.status is not None:
            update_kwargs["status"] = dto.status

        if update_kwargs:
            event.update(**update_kwargs)
            event.validate_introduction()

        return await self.event_repo.update(event)
