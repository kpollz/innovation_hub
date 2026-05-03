"""Chat DTOs for request/response serialization."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# --- Input DTOs ---

class CreateSessionDTO(BaseModel):
    """Request body for creating a chat session."""
    title: str = Field(..., max_length=200, description="Session name")


class RenameSessionDTO(BaseModel):
    """Request body for renaming a chat session."""
    title: str = Field(..., max_length=200, description="New session name")


class SendMessageDTO(BaseModel):
    """Request body for sending a message."""
    content: str = Field(..., min_length=1, description="Message text")


# --- Output DTOs ---

class SessionResponseDTO(BaseModel):
    """Response DTO for a chat session."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class MessageResponseDTO(BaseModel):
    """Response DTO for a chat message."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    content: str
    sources: Optional[Dict[str, Any]] = None
    created_at: datetime
