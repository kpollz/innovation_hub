"""Create room use case."""
from uuid import UUID

from app.application.dto.room_dto import CreateRoomDTO, RoomResponseDTO
from app.domain.entities.room import Room
from app.domain.repositories.room_repository import RoomRepository


class CreateRoomUseCase:
    """Use case: Create a new brainstorming room."""
    
    def __init__(self, room_repo: RoomRepository):
        self.room_repo = room_repo
    
    async def execute(
        self,
        dto: CreateRoomDTO,
        created_by: UUID
    ) -> RoomResponseDTO:
        """
        Execute the use case.
        
        Args:
            dto: Creation data
            created_by: ID of the user creating the room
            
        Returns:
            Created room as DTO
        """
        # Create domain entity
        room = Room(
            name=dto.name,
            description=dto.description,
            problem_id=dto.problem_id,
            created_by=created_by
        )
        
        # Persist via repository
        created_room = await self.room_repo.create(room)
        
        # Return as DTO
        return RoomResponseDTO.model_validate(created_room)
