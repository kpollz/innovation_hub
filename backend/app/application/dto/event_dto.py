"""Event DTOs for crossing layer boundaries."""
import re
from datetime import date, datetime
from typing import Optional
from urllib.parse import urlparse
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.value_objects.status import EventStatus

# URL pattern: must start with http:// or https://
URL_PATTERN = re.compile(r"^https?://\S+$")


# Input DTOs
class CreateEventDTO(BaseModel):
    """Input for creating an event."""
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None  # TipTap JSON string
    introduction_type: str = Field(default="editor", pattern="^(editor|embed)$")
    embed_url: Optional[str] = None
    status: EventStatus = Field(default=EventStatus.DRAFT)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def validate_introduction_mode(self) -> "CreateEventDTO":
        """XOR validation + URL validation + auto-clear non-relevant field."""
        if self.introduction_type == "embed":
            if not self.embed_url:
                raise ValueError("embed_url is required when introduction_type is 'embed'")
            if not URL_PATTERN.match(self.embed_url):
                raise ValueError("embed_url must be a valid URL starting with http:// or https://")
            self.description = None  # auto-clear
        elif self.introduction_type == "editor":
            self.embed_url = None  # auto-clear
        return self


class UpdateEventDTO(BaseModel):
    """Input for updating an event."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    introduction_type: Optional[str] = Field(None, pattern="^(editor|embed)$")
    embed_url: Optional[str] = None
    status: Optional[EventStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# Output DTOs
class EventCreatorDTO(BaseModel):
    """Lightweight user info embedded in event response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class EventResponseDTO(BaseModel):
    """Output for event data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str] = None
    introduction_type: str = "editor"
    embed_url: Optional[str] = None
    status: EventStatus
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_by: UUID
    creator: Optional[EventCreatorDTO] = None
    team_count: int = 0
    idea_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None


class EventListResponseDTO(BaseModel):
    """Output for paginated event list."""
    items: list[EventResponseDTO]
    total: int
    page: int
    limit: int
