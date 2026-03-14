"""Problem DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.value_objects.category import ProblemCategory
from app.domain.value_objects.status import ProblemStatus


# Input DTOs
class CreateProblemDTO(BaseModel):
    """Input for creating a problem."""
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10)
    category: ProblemCategory


class UpdateProblemDTO(BaseModel):
    """Input for updating a problem."""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    content: Optional[str] = Field(None, min_length=10)
    category: Optional[ProblemCategory] = None
    status: Optional[ProblemStatus] = None


class ProblemListFiltersDTO(BaseModel):
    """Filters for listing problems."""
    status: Optional[ProblemStatus] = None
    category: Optional[ProblemCategory] = None
    author_id: Optional[UUID] = None
    search: Optional[str] = None


# Output DTOs
class ProblemResponseDTO(BaseModel):
    """Output for problem data."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    title: str
    content: str
    category: ProblemCategory
    status: ProblemStatus
    author_id: UUID
    room_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ProblemListResponseDTO(BaseModel):
    """Output for paginated problem list."""
    items: List[ProblemResponseDTO]
    total: int
    page: int
    limit: int
