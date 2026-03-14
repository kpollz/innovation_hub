"""Vote DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Input DTOs
class CreateVoteDTO(BaseModel):
    """Input for creating a vote."""
    idea_id: UUID
    stars: int = Field(..., ge=1, le=5)


class UpdateVoteDTO(BaseModel):
    """Input for updating a vote."""
    stars: int = Field(..., ge=1, le=5)


# Output DTOs
class VoteResponseDTO(BaseModel):
    """Output for vote data."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    idea_id: UUID
    user_id: UUID
    stars: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class VoteStatsDTO(BaseModel):
    """Vote statistics for an idea."""
    idea_id: UUID
    average: float
    count: int
    distribution: Dict[int, int]  # stars -> count
