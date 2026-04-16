"""Delete event use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.event_repository import EventRepository


class DeleteEventUseCase:
    """Use case: Delete an event (Admin only)."""

    def __init__(self, event_repo: EventRepository):
        self.event_repo = event_repo

    async def execute(
        self,
        event_id: UUID,
        current_user_id: UUID,
        is_admin: bool = False,
    ) -> bool:
        """Delete an event."""
        if not is_admin:
            raise ForbiddenException("Only admins can delete events")

        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        return await self.event_repo.delete(event_id)
