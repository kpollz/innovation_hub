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
        room = Room(
            name=dto.name,
            description=dto.description,
            problem_id=dto.problem_id,
            created_by=created_by,
        )
        return await self.room_repo.create(room)
