"""Notification entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class Notification:
    """Domain entity representing an in-app notification."""

    user_id: UUID  # Recipient
    actor_id: UUID  # Who triggered the action
    type: str  # comment_added | reaction_added | vote_added | status_changed
    target_id: UUID  # Problem or idea ID
    target_type: str  # 'problem' or 'idea'
    target_title: str  # Denormalized for display
    action_detail: Optional[str] = None  # Detail about the action (comment content, reaction type, vote stars, status change)
    id: UUID = field(default_factory=uuid4)
    is_read: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    def mark_read(self) -> None:
        """Mark notification as read."""
        self.is_read = True
        self.updated_at = datetime.utcnow()
