"""List rooms use case."""
from app.application.dto.room_dto import (
    RoomListFiltersDTO,
    RoomListResponseDTO,
    RoomResponseDTO
)
from app.domain.repositories.room_repository import RoomRepository


class ListRoomsUseCase:
    """Use case: List rooms with pagination and filters."""
    
    def __init__(self, room_repo: RoomRepository):
        self.room_repo = room_repo
    
    async def execute(
        self,
        filters: RoomListFiltersDTO,
        page: int = 1,
        limit: int = 20
    ) -> RoomListResponseDTO:
        """Execute the use case."""
        filter_dict = {}
        if filters.status:
            filter_dict["status"] = filters.status
        if filters.problem_id:
            filter_dict["problem_id"] = filters.problem_id
        if filters.created_by:
            filter_dict["created_by"] = filters.created_by
        if filters.search:
            filter_dict["search"] = filters.search
        
        rooms, total = await self.room_repo.list(
            filters=filter_dict,
            page=page,
            limit=limit
        )
        
        room_dtos = [
            RoomResponseDTO.model_validate(r) for r in rooms
        ]
        
        return RoomListResponseDTO(
            items=room_dtos,
            total=total,
            page=page,
            limit=limit
        )
