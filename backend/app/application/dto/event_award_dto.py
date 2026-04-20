"""Event award DTOs for API I/O."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateAwardRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    rank_order: int = Field(..., ge=1)


class UpdateAwardRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    rank_order: Optional[int] = Field(None, ge=1)


class AddTeamToAwardRequest(BaseModel):
    team_id: UUID


class AwardTeamResponse(BaseModel):
    team_id: UUID
    team_name: str
    team_slogan: Optional[str] = None
    leader_id: UUID
    leader_name: Optional[str] = None
    leader_avatar_url: Optional[str] = None


class AwardResponse(BaseModel):
    id: UUID
    event_id: UUID
    name: str
    rank_order: int
    teams: list[AwardTeamResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


class AwardListResponse(BaseModel):
    items: list[AwardResponse]
