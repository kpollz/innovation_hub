"""Problem entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID, uuid4

from app.domain.value_objects.category import ProblemCategory
from app.domain.value_objects.status import ProblemStatus
from app.domain.value_objects.visibility import Visibility


@dataclass
class Problem:
    """Domain entity representing a problem in the Problem Feed."""
    title: str
    content: dict[str, Any]
    category: ProblemCategory
    author_id: UUID
    id: UUID = field(default_factory=uuid4)
    summary: Optional[str] = None
    status: ProblemStatus = field(default=ProblemStatus.OPEN)
    visibility: Visibility = field(default=Visibility.PUBLIC)
    shared_user_ids: List[UUID] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    room_id: Optional[UUID] = None
    
    def can_transition_to(self, new_status: ProblemStatus) -> bool:
        """Business rule: Check if status transition is valid."""
        valid_transitions = ProblemStatus.valid_transitions()
        return new_status in valid_transitions.get(self.status, [])
    
    def transition_to(self, new_status: ProblemStatus) -> None:
        """Business rule: Perform status transition."""
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from {self.status.value} to {new_status.value}"
            )
        self.status = new_status
        self.updated_at = datetime.utcnow()
    
    def link_to_room(self, room_id: UUID) -> None:
        """Business rule: Link problem to brainstorming room."""
        if self.room_id is not None:
            raise ValueError("Problem is already linked to a room")
        self.room_id = room_id
        self.transition_to(ProblemStatus.BRAINSTORMING)
    
    def update_content(
        self,
        title: Optional[str] = None,
        summary: Optional[str] = None,
        content: Optional[dict[str, Any]] = None,
        category: Optional[ProblemCategory] = None
    ) -> None:
        """Update problem content."""
        if title is not None:
            self.title = title
        if summary is not None:
            self.summary = summary
        if content is not None:
            self.content = content
        if category is not None:
            self.category = category
        self.updated_at = datetime.utcnow()

    def update_privacy(
        self,
        visibility: Optional[Visibility] = None,
        shared_user_ids: Optional[List[UUID]] = None,
    ) -> None:
        """Update problem privacy settings."""
        if shared_user_ids is not None:
            self.shared_user_ids = shared_user_ids
            # If sharing with specific users, automatically make private
            if shared_user_ids and visibility is None:
                self.visibility = Visibility.PRIVATE
        if visibility is not None:
            self.visibility = visibility
        self.updated_at = datetime.utcnow()

    def is_visible_to(self, user_id: UUID, is_admin: bool = False) -> bool:
        """Check if a user can view this problem."""
        if self.visibility == Visibility.PUBLIC:
            return True
        # Private: author, shared users, and admins can see
        if is_admin:
            return True
        if self.author_id == user_id:
            return True
        if user_id in self.shared_user_ids:
            return True
        return False
