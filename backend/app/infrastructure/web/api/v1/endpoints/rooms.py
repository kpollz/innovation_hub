"""Room endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.room_dto import (
    CreateRoomDTO,
    UpdateRoomDTO,
    RoomListFiltersDTO,
    RoomResponseDTO,
    RoomListResponseDTO
)
from app.application.use_cases.room.create_room import CreateRoomUseCase
from app.application.use_cases.room.list_rooms import ListRoomsUseCase
from app.infrastructure.database.repositories.room_repository_impl import SQLRoomRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("", response_model=RoomListResponseDTO)
async def list_rooms(
    filters: RoomListFiltersDTO = Depends(),
    page: int = 1,
    limit: int = 20,
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo)
):
    """List rooms with pagination and filters."""
    use_case = ListRoomsUseCase(room_repo)
    return await use_case.execute(filters, page, limit)


@router.post("", response_model=RoomResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_room(
    data: CreateRoomDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo)
):
    """Create a new room."""
    use_case = CreateRoomUseCase(room_repo)
    return await use_case.execute(data, current_user.id)


@router.get("/{room_id}", response_model=RoomResponseDTO)
async def get_room(
    room_id: UUID,
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo)
):
    """Get a room by ID."""
    room = await room_repo.get_by_id(room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return RoomResponseDTO.model_validate(room)
