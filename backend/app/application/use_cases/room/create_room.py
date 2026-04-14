"""Create room use case."""
from uuid import UUID

from app.application.dto.room_dto import CreateRoomDTO
from app.domain.entities.room import Room
from app.domain.repositories.room_repository import RoomRepository


class CreateRoomUseCase:
    """Use case: Create a new brainstorming room."""

    def __init__(self, room_repo: RoomRepository):
        self.room_repo = room_repo

    async def execute(self, dto: CreateRoomDTO, created_by: UUID) -> Room:
        """Create a new room and return the domain entity."""
        shared_user_ids = [uid for uid in dto.shared_user_ids] if dto.shared_user_ids else []
        # If shared_user_ids provided, auto-set visibility to private
        visibility = dto.visibility or "public"
        if shared_user_ids and visibility == "public":
            visibility = "private"

        room = Room(
            name=dto.name,
            description=dto.description,
            problem_id=dto.problem_id,
            created_by=created_by,
            visibility=visibility,
            shared_user_ids=shared_user_ids,
        )
        return await self.room_repo.create(room)
