"""Room entity - Pure business logic, no infrastructure dependencies."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from app.domain.value_objects.status import RoomStatus

if TYPE_CHECKING:
    from app.domain.entities.problem import Problem


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
        problem: Optional[Problem] = None,
    ) -> bool:
        """Check if a user can view this room.

        If the room is linked to a problem, privacy is inherited from the problem.
        Otherwise, uses the room's own visibility and shared_user_ids.
        """
        # If linked to a problem, inherit privacy from it
        if self.problem_id and problem is not None:
            return problem.is_visible_to(user_id, is_admin)

        # Standalone room: use own privacy settings
        if self.visibility == "public":
            return True
        if is_admin:
            return True
        if self.created_by == user_id:
            return True
        if user_id in self.shared_user_ids:
            return True
        return False
