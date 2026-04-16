"""Room entity - Pure business logic, no infrastructure dependencies."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from app.domain.value_objects.status import RoomStatus


@dataclass
class Room:
    """Domain entity representing a brainstorming room (Idea Lab)."""
    name: str
    created_by: UUID
    id: UUID = field(default_factory=uuid4)
    problem_id: Optional[UUID] = None
    description: Optional[str] = None
    status: RoomStatus = field(default=RoomStatus.ACTIVE)
    visibility: str = "public"
    shared_user_ids: List[UUID] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    def archive(self) -> None:
        """Archive the room."""
        self.status = RoomStatus.ARCHIVED
        self.updated_at = datetime.utcnow()

    def activate(self) -> None:
        """Reactivate the room."""
        self.status = RoomStatus.ACTIVE
        self.updated_at = datetime.utcnow()

    def update(self, name: Optional[str] = None, description: Optional[str] = None) -> None:
        """Update room information."""
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        self.updated_at = datetime.utcnow()

    def is_active(self) -> bool:
        """Check if room is active."""
        return self.status == RoomStatus.ACTIVE

    def is_visible_to(
        self,
        user_id: UUID,
        is_admin: bool = False,
    ) -> bool:
        """Check if a user can view this room.

        Room privacy is independent of Problem. Uses its own visibility
        and shared_user_ids regardless of whether linked to a problem.
        """
        if self.visibility == "public":
            return True
        if is_admin:
            return True
        if self.created_by == user_id:
            return True
        if user_id in self.shared_user_ids:
            return True
        return False
