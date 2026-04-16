"""Event Team DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# --- Input DTOs ---

class CreateEventTeamDTO(BaseModel):
    """Input for creating a team."""
    name: str = Field(..., min_length=2, max_length=100)
    slogan: Optional[str] = Field(None, max_length=255)


class UpdateMemberStatusDTO(BaseModel):
    """Input for approving/rejecting a member."""
    status: str = Field(..., pattern="^(active|rejected)$")


class TransferLeadDTO(BaseModel):
    """Input for transferring team leadership."""
    new_leader_id: UUID


class AssignReviewDTO(BaseModel):
    """Input for assigning review target."""
    target_team_id: UUID


# --- Output DTOs ---

class EventTeamLeaderDTO(BaseModel):
    """Lightweight leader info in team response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class EventTeamAssignedDTO(BaseModel):
    """Assigned team info for review."""
    id: UUID
    name: str


class EventTeamResponseDTO(BaseModel):
    """Output for event team data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_id: UUID
    name: str
    slogan: Optional[str] = None
    leader_id: UUID
    leader: Optional[EventTeamLeaderDTO] = None
    assigned_to_team_id: Optional[UUID] = None
    assigned_to_team: Optional[EventTeamAssignedDTO] = None
    member_count: int = 0
    idea_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None


class EventTeamListResponseDTO(BaseModel):
    """Output for paginated team list."""
    items: list[EventTeamResponseDTO]
    total: int
    page: int
    limit: int


class EventTeamMemberUserDTO(BaseModel):
    """Lightweight user info in member response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class EventTeamMemberResponseDTO(BaseModel):
    """Output for event team member data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    team_id: UUID
    user_id: UUID
    user: Optional[EventTeamMemberUserDTO] = None
    status: str
    joined_at: Optional[datetime] = None
