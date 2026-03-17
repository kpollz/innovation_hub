"""Comment DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Input DTOs
class CreateCommentDTO(BaseModel):
    """Input for creating a comment."""
    target_id: UUID
    target_type: str = Field(..., pattern="^(problem|idea)$")
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[UUID] = None


class UpdateCommentDTO(BaseModel):
    """Input for updating a comment."""
    content: str = Field(..., min_length=1, max_length=5000)


class CommentAuthorDTO(BaseModel):
    """Lightweight user info embedded in comment response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# Output DTOs
class CommentResponseDTO(BaseModel):
    """Output for comment data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    target_id: UUID
    target_type: str
    content: str
    author_id: UUID
    author: Optional[CommentAuthorDTO] = None
    parent_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class CommentListResponseDTO(BaseModel):
    """Output for paginated comment list."""
    items: List[CommentResponseDTO]
    total: int
    page: int
    limit: int
