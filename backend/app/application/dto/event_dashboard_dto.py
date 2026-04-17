"""Event Dashboard DTOs."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DashboardIdeaDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    team: Optional[dict] = None
    author: Optional[dict] = None
    total_score: Optional[float] = None
    score_count: int = 0
    criteria_breakdown: dict = {}
    created_at: datetime


class DashboardIdeaListDTO(BaseModel):
    items: list[DashboardIdeaDTO]


class DashboardTeamDTO(BaseModel):
    team: Optional[dict] = None
    idea_count: int = 0
    avg_score: Optional[float] = None
    total_score: float = 0.0
    members: list[dict] = []


class DashboardTeamListDTO(BaseModel):
    items: list[DashboardTeamDTO]
