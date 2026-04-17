"""Event Idea DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# --- Input DTOs ---

class CreateEventIdeaDTO(BaseModel):
    """Input for manual idea submission."""
    title: str = Field(..., min_length=3, max_length=255)
    user_problem: Optional[dict] = None  # TipTap JSON
    user_scenarios: Optional[dict] = None
    user_expectation: Optional[dict] = None
    research: Optional[dict] = None
    solution: dict = Field(..., description="TipTap JSON (required)")
    source_type: str = Field(default="manual", pattern="^(manual)$")


class UpdateEventIdeaDTO(BaseModel):
    """Input for editing an idea."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    user_problem: Optional[dict] = None
    user_scenarios: Optional[dict] = None
    user_expectation: Optional[dict] = None
    research: Optional[dict] = None
    solution: Optional[dict] = None


# --- Output DTOs ---

class EventIdeaAuthorDTO(BaseModel):
    """Lightweight author info."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class EventIdeaTeamDTO(BaseModel):
    """Team info in idea response."""
    id: UUID
    name: str
    slogan: Optional[str] = None


class EventIdeaResponseDTO(BaseModel):
    """Output for event idea data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_id: UUID
    team_id: UUID
    team: Optional[EventIdeaTeamDTO] = None
    title: str
    user_problem: Optional[dict] = None
    user_scenarios: Optional[dict] = None
    user_expectation: Optional[dict] = None
    research: Optional[dict] = None
    solution: dict
    source_type: str = "manual"
    source_problem_id: Optional[UUID] = None
    source_room_id: Optional[UUID] = None
    source_idea_id: Optional[UUID] = None
    author_id: UUID
    author: Optional[EventIdeaAuthorDTO] = None
    total_score: Optional[float] = None
    score_count: int = 0
    can_score: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None


class EventIdeaListResponseDTO(BaseModel):
    """Output for paginated idea list."""
    items: list[EventIdeaResponseDTO]
    total: int
    page: int
    limit: int
