"""Problem DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.value_objects.category import ProblemCategory
from app.domain.value_objects.status import ProblemStatus
from app.domain.value_objects.visibility import Visibility


# Input DTOs
class CreateProblemDTO(BaseModel):
    """Input for creating a problem."""
    title: str = Field(..., min_length=5, max_length=255)
    summary: Optional[str] = Field(None, max_length=500)
    content: dict[str, Any] = Field(..., description="TipTap JSON")
    category: ProblemCategory
    visibility: Visibility = Field(default=Visibility.PUBLIC)
    shared_user_ids: Optional[List[UUID]] = Field(default=None)


class UpdateProblemDTO(BaseModel):
    """Input for updating a problem."""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    summary: Optional[str] = Field(None, max_length=500)
    content: Optional[dict[str, Any]] = None
    category: Optional[ProblemCategory] = None
    status: Optional[ProblemStatus] = None
    visibility: Optional[Visibility] = None
    shared_user_ids: Optional[List[UUID]] = None


class ProblemListFiltersDTO(BaseModel):
    """Filters for listing problems."""
    status: Optional[ProblemStatus] = None
    category: Optional[ProblemCategory] = None
    author_id: Optional[UUID] = None
    search: Optional[str] = None
    sort: Optional[str] = None


# Avoid circular import - use forward ref for author
class ProblemAuthorDTO(BaseModel):
    """Lightweight user info embedded in problem response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class SharedUserDTO(BaseModel):
    """Lightweight shared user info embedded in problem response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class ProblemRoomSummaryDTO(BaseModel):
    """Lightweight room info embedded in problem response."""
    id: UUID
    name: str
    status: str


# Output DTOs
class ProblemResponseDTO(BaseModel):
    """Output for problem data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    summary: Optional[str] = None
    content: dict[str, Any]
    category: ProblemCategory
    status: ProblemStatus
    visibility: Visibility = Visibility.PUBLIC
    shared_user_ids: List[UUID] = []
    shared_users: List[SharedUserDTO] = []
    author_id: UUID
    author: Optional[ProblemAuthorDTO] = None
    room_id: Optional[UUID] = None  # deprecated: first room id for backwards compat
    rooms: List[ProblemRoomSummaryDTO] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    likes_count: int = 0
    dislikes_count: int = 0
    insights_count: int = 0
    comments_count: int = 0
    user_reaction: Optional[str] = None


class ProblemListResponseDTO(BaseModel):
    """Output for paginated problem list."""
    items: List[ProblemResponseDTO]
    total: int
    page: int
    limit: int
