"""Room endpoints."""
from datetime import date, datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

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


async def _get_optional_user_info(request: Request) -> tuple[Optional[UUID], bool]:
    """Extract user ID and is_admin from token if present."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, False
    token = auth_header.replace("Bearer ", "")
    try:
        from app.application.services.jwt_service import JWTService
        jwt_service = JWTService()
        payload = jwt_service.verify_token(token)
        if payload.get("type") != "access":
            return None, False
        user_id = payload.get("sub")
        role = payload.get("role", "member")
        return (UUID(user_id) if user_id else None), role == "admin"
    except Exception:
        return None, False


@router.get("", response_model=RoomListResponseDTO)
async def list_rooms(
    request: Request,
    filters: RoomListFiltersDTO = Depends(),
    page: int = 1,
    limit: int = 20,
    date_from: Optional[date] = Query(None, description="Start date (inclusive), e.g. 2026-01-01"),
    date_to: Optional[date] = Query(None, description="End date (inclusive), e.g. 2026-03-31"),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
):
    """List rooms with enriched data."""
    current_user_id, is_admin = await _get_optional_user_info(request)
    filter_dict = filters.model_dump(exclude_none=True)
    if date_from:
        filter_dict["created_after"] = datetime.combine(date_from, datetime.min.time())
    if date_to:
        filter_dict["created_before"] = datetime.combine(date_to + timedelta(days=1), datetime.min.time())
    # Add privacy filter info
    if current_user_id:
        filter_dict["current_user_id"] = current_user_id
        filter_dict["is_admin"] = is_admin
    rooms, total = await room_repo.list(filter_dict, page, limit)
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
        from app.domain.value_objects.status import ProblemStatus
        problem = await problem_repo.get_by_id(data.problem_id)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Linked problem not found",
            )
        # Block room creation for terminal statuses
        if problem.status in (ProblemStatus.SOLVED, ProblemStatus.CLOSED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create room for a problem with status '{problem.status.value}'",
            )
        # Check duplicate room name within same problem
        existing_rooms = await room_repo.list_by_problem_id(data.problem_id)
        if any(r.name == data.name for r in existing_rooms):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A room named '{data.name}' already exists for this problem",
            )
        # Transition problem status to brainstorming
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
    request: Request,
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
):
    """Get a room by ID with enriched data."""
    current_user_id, is_admin = await _get_optional_user_info(request)
    room = await room_repo.get_by_id(room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if not room.is_visible_to(current_user_id or UUID(int=0), is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this room",
        )
    return await enrich_room(room, user_repo, idea_repo)


@router.patch("/{room_id}", response_model=RoomResponseDTO)
async def update_room(
    room_id: UUID,
    data: UpdateRoomDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    room_repo: SQLRoomRepository = Depends(deps.get_room_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
):
    """Update a room (creator or admin only)."""
    room = await room_repo.get_by_id(room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # Privacy check: must be visible to user
    is_admin = current_user.role == "admin"
    if not room.is_visible_to(current_user.id, is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this room",
        )

    # Only creator or admin can edit
    if room.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit")

    if data.name is not None:
        room.name = data.name
    if data.description is not None:
        room.description = data.description
    if data.visibility is not None:
        room.visibility = data.visibility
    if data.shared_user_ids is not None:
        room.shared_user_ids = [uid for uid in data.shared_user_ids]
        # Auto-set private if sharing with specific users
        if data.shared_user_ids and room.visibility == "public":
            room.visibility = "private"
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
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
):
    """Delete a room (creator or admin only)."""
    room = await room_repo.get_by_id(room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # Privacy check
    is_admin = current_user.role == "admin"
    if not room.is_visible_to(current_user.id, is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this room",
        )

    if room.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await room_repo.delete(room_id)
    return None
