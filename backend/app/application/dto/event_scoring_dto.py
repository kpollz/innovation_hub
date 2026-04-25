"""Event Scoring DTOs."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# --- Criteria DTOs ---

class CriteriaInputDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    group: str = Field(..., pattern="^(problem|solution)$")
    description: Optional[str] = Field(None, max_length=500)
    weight: float = Field(default=1.0, ge=0.0)
    max_score: float = Field(default=12.5, gt=0.0)
    sort_order: int = Field(default=0, ge=0)


class CreateCriteriaDTO(BaseModel):
    criteria: list[CriteriaInputDTO] = Field(default_factory=list)


class CriteriaResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_id: UUID
    group: str
    name: str
    description: Optional[str] = None
    weight: float = 1.0
    max_score: float = 12.5
    sort_order: int = 0
    created_at: datetime


# --- Score DTOs ---

VALID_LIKERT_SCORES = {2.5, 5.0, 7.5, 10.0, 12.5}


class ScoreInputDTO(BaseModel):
    criteria_scores: dict[str, float] = Field(..., description="Map of criteria_id to score")
    criteria_notes: Optional[dict[str, Optional[str]]] = Field(
        default=None, description="Map of criteria_id to note (optional, max 500 chars per note)"
    )


class ScoreResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_idea_id: UUID
    scorer_team_id: UUID
    scorer_team: Optional[dict] = None
    criteria_scores: dict
    criteria_notes: Optional[dict] = None
    total_score: float
    created_at: datetime
    updated_at: Optional[datetime] = None


class ScoreListResponseDTO(BaseModel):
    idea_id: UUID
    scores: list[ScoreResponseDTO]
    summary: dict
