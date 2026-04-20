"""Notification DTOs for crossing layer boundaries."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationActorDTO(BaseModel):
    """Lightweight user info embedded in notification response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class NotificationResponseDTO(BaseModel):
    """Output for notification data."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    actor_id: UUID
    actor: Optional[NotificationActorDTO] = None
    type: str
    target_id: UUID
    target_type: str
    target_title: str
    action_detail: Optional[str] = None
    reference_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime


class NotificationListResponseDTO(BaseModel):
    """Output for paginated notification list."""
    items: List[NotificationResponseDTO]
    total: int
    page: int
    limit: int
    unread_count: int
