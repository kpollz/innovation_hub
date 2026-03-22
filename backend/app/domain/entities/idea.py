"""Idea entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from app.domain.value_objects.status import IdeaStatus


@dataclass
class Idea:
    """Domain entity representing an idea in a brainstorming room."""
    room_id: UUID
    title: str
    description: str
    author_id: UUID
    id: UUID = field(default_factory=uuid4)
    summary: Optional[str] = None
    status: IdeaStatus = field(default=IdeaStatus.DRAFT)
    is_pinned: bool = field(default=False)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    def can_transition_to(self, new_status: IdeaStatus) -> bool:
        """Business rule: Check if status transition is valid."""
        valid_transitions = IdeaStatus.valid_transitions()
        return new_status in valid_transitions.get(self.status, [])
    
    def transition_to(self, new_status: IdeaStatus) -> None:
        """Business rule: Perform status transition."""
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from {self.status.value} to {new_status.value}"
            )
        self.status = new_status
        self.updated_at = datetime.utcnow()
    
    def pin(self) -> None:
        """Pin the idea to the top."""
        self.is_pinned = True
        self.updated_at = datetime.utcnow()
    
    def unpin(self) -> None:
        """Unpin the idea."""
        self.is_pinned = False
        self.updated_at = datetime.utcnow()
    
    def update_content(
        self,
        title: Optional[str] = None,
        description: Optional[str] = None,
        summary: Optional[str] = None
    ) -> None:
        """Update idea content."""
        if title is not None:
            self.title = title
        if description is not None:
            self.description = description
        if summary is not None:
            self.summary = summary
        self.updated_at = datetime.utcnow()
