"""Room endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.room_dto import (
    CreateRoomDTO,
    UpdateRoomDTO,
    RoomListFiltersDTO,
    RoomResponseDTO,
    RoomListResponseDTO,
)
from app.application.services.response_enrichment import enrich_room, enrich_rooms
from app.application.use_cases.room.create_room import CreateRoomUseCase
from app.infrastructure.database.repositories.room_repository_impl import SQLRoomRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.database.repositories.idea_repository_impl import SQLIdeaRepository
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("", response_model=RoomListResponseDTO)
async def list_rooms(
    filters: RoomListFiltersDTO = Depends(),
    page: int = 1,
    limit: int = 20,
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
):
    """List rooms with enriched data."""
    rooms, total = await room_repo.list(
        filters.model_dump(exclude_none=True), page, limit
    )
    items = await enrich_rooms(rooms, user_repo, idea_repo)
    return RoomListResponseDTO(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=RoomResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_room(
    data: CreateRoomDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
):
    """Create a new room. If problem_id is provided, link to problem and update its status."""
    # If linked to a problem, transition problem to brainstorming
    if data.problem_id:
        problem = await problem_repo.get_by_id(data.problem_id)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Linked problem not found",
            )
        # Check if room already exists for this problem
        existing_room = await room_repo.get_by_problem_id(data.problem_id)
        if existing_room:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A room already exists for this problem",
            )
        # Transition problem status to brainstorming
        from app.domain.value_objects.status import ProblemStatus
        try:
            problem.transition_to(ProblemStatus.BRAINSTORMING)
            await problem_repo.update(problem)
        except ValueError:
            pass  # Already in brainstorming or later status

    use_case = CreateRoomUseCase(room_repo)
    room = await use_case.execute(data, current_user.id)

    return await enrich_room(room, user_repo, idea_repo)


@router.get("/{room_id}", response_model=RoomResponseDTO)
async def get_room(
    room_id: UUID,
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
):
    """Get a room by ID with enriched data."""
    room = await room_repo.get_by_id(room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return await enrich_room(room, user_repo, idea_repo)


@router.patch("/{room_id}", response_model=RoomResponseDTO)
async def update_room(
    room_id: UUID,
    data: UpdateRoomDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
):
    """Update a room (creator or admin only)."""
    room = await room_repo.get_by_id(room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if room.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if data.name is not None:
        room.name = data.name
    if data.description is not None:
        room.description = data.description
    if data.status is not None:
        from app.domain.value_objects.status import RoomStatus
        if data.status == RoomStatus.ARCHIVED:
            room.archive()
        elif data.status == RoomStatus.ACTIVE:
            room.activate()

    updated = await room_repo.update(room)
    return await enrich_room(updated, user_repo, idea_repo)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
):
    """Delete a room (creator or admin only)."""
    room = await room_repo.get_by_id(room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if room.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await room_repo.delete(room_id)
    return None
