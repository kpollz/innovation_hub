"""Idea DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.value_objects.status import IdeaStatus


# Input DTOs
class CreateIdeaDTO(BaseModel):
    """Input for creating an idea."""
    room_id: UUID
    title: str = Field(..., min_length=3, max_length=255)
    description: dict[str, Any] = Field(..., description="TipTap JSON")
    summary: Optional[str] = None


class UpdateIdeaDTO(BaseModel):
    """Input for updating an idea."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[dict[str, Any]] = None
    summary: Optional[str] = None
    status: Optional[IdeaStatus] = None
    is_pinned: Optional[bool] = None


class IdeaListFiltersDTO(BaseModel):
    """Filters for listing ideas."""
    room_id: Optional[UUID] = None
    author_id: Optional[UUID] = None
    status: Optional[IdeaStatus] = None
    search: Optional[str] = None


class IdeaAuthorDTO(BaseModel):
    """Lightweight user info embedded in idea response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserVoteDTO(BaseModel):
    """Current user's vote on an idea."""
    stars: int


# Output DTOs
class IdeaResponseDTO(BaseModel):
    """Output for idea data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    room_id: UUID
    title: str
    description: dict[str, Any]
    summary: Optional[str] = None
    status: IdeaStatus
    author_id: UUID
    author: Optional[IdeaAuthorDTO] = None
    is_pinned: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    vote_avg: float = 0.0
    vote_count: int = 0
    likes_count: int = 0
    dislikes_count: int = 0
    insights_count: int = 0
    comments_count: int = 0
    user_reaction: Optional[str] = None
    user_vote: Optional[UserVoteDTO] = None


class IdeaListResponseDTO(BaseModel):
    """Output for paginated idea list."""
    items: List[IdeaResponseDTO]
    total: int
    page: int
    limit: int
