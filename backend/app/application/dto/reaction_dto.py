"""Reaction DTOs for crossing layer boundaries."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.entities.reaction import ReactionType


# Input DTOs
class CreateReactionDTO(BaseModel):
    """Input for creating a reaction."""
    target_id: UUID
    target_type: str = Field(..., pattern="^(problem|idea)$")
    type: ReactionType


class UpdateReactionDTO(BaseModel):
    """Input for updating a reaction."""
    type: ReactionType


# Output DTOs
class ReactionResponseDTO(BaseModel):
    """Output for reaction data."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    target_id: UUID
    target_type: str
    type: ReactionType
    user_id: UUID
    created_at: datetime


class ReactionCountsDTO(BaseModel):
    """Reaction counts for a target."""
    target_id: UUID
    target_type: str
    like: int = 0
    dislike: int = 0
    insight: int = 0
    total: int = 0
