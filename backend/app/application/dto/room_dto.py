"""Room DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.value_objects.status import RoomStatus


# Input DTOs
class CreateRoomDTO(BaseModel):
    """Input for creating a room."""
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    problem_id: Optional[UUID] = None


class UpdateRoomDTO(BaseModel):
    """Input for updating a room."""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    status: Optional[RoomStatus] = None


class RoomListFiltersDTO(BaseModel):
    """Filters for listing rooms."""
    status: Optional[RoomStatus] = None
    problem_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    search: Optional[str] = None


class RoomCreatorDTO(BaseModel):
    """Lightweight user info embedded in room response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# Output DTOs
class RoomResponseDTO(BaseModel):
    """Output for room data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    problem_id: Optional[UUID] = None
    created_by: UUID
    creator: Optional[RoomCreatorDTO] = None
    status: RoomStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    idea_count: int = 0


class RoomListResponseDTO(BaseModel):
    """Output for paginated room list."""
    items: List[RoomResponseDTO]
    total: int
    page: int
    limit: int
