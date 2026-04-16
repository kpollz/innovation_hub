"""Event entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from app.domain.value_objects.status import EventStatus


@dataclass
class Event:
    """Domain entity representing an innovation event."""
    title: str
    created_by: UUID
    id: UUID = field(default_factory=uuid4)
    description: Optional[str] = None  # TipTap JSON string
    introduction_type: str = "editor"  # "editor" | "embed"
    embed_url: Optional[str] = None
    status: EventStatus = field(default=EventStatus.DRAFT)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    def can_transition_to(self, new_status: EventStatus) -> bool:
        """Business rule: Check if status transition is valid."""
        valid_transitions = EventStatus.valid_transitions()
        return new_status in valid_transitions.get(self.status, [])

    def transition_to(self, new_status: EventStatus) -> None:
        """Business rule: Perform status transition."""
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from {self.status.value} to {new_status.value}"
            )
        self.status = new_status
        self.updated_at = datetime.utcnow()

    def close(self) -> None:
        """Close the event, making it read-only."""
        self.transition_to(EventStatus.CLOSED)
        self.closed_at = datetime.utcnow()

    def is_closed(self) -> bool:
        """Check if event is closed (read-only)."""
        return self.status == EventStatus.CLOSED

    def is_active(self) -> bool:
        """Check if event is active (accepts submissions)."""
        return self.status == EventStatus.ACTIVE

    def update(
        self,
        title: Optional[str] = None,
        description: Optional[str] = None,
        embed_url: Optional[str] = None,
        introduction_type: Optional[str] = None,
        status: Optional[EventStatus] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> None:
        """Update event fields."""
        if title is not None:
            self.title = title
        if description is not None:
            self.description = description
        if embed_url is not None:
            self.embed_url = embed_url
        if introduction_type is not None:
            self.introduction_type = introduction_type
        if start_date is not None:
            self.start_date = start_date
        if end_date is not None:
            self.end_date = end_date
        if status is not None:
            self.transition_to(status)
        self.updated_at = datetime.utcnow()

    def validate_introduction(self) -> None:
        """Validate and auto-enforce XOR logic for introduction type."""
        if self.introduction_type == "embed":
            if not self.embed_url:
                raise ValueError("embed_url is required when introduction_type is 'embed'")
            self.description = None  # auto-clear when embed mode
        elif self.introduction_type == "editor":
            self.embed_url = None  # auto-clear when editor mode
