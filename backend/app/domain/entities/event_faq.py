"""EventFAQ entity - Pure business logic."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
from uuid import UUID, uuid4


@dataclass
class EventFAQ:
    """Domain entity representing a FAQ for an event."""
    event_id: UUID
    question: str
    created_by: UUID
    id: UUID = field(default_factory=uuid4)
    answer: Optional[dict[str, Any]] = None
    sort_order: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    def update(
        self,
        question: Optional[str] = None,
        answer: Optional[dict[str, Any]] = None,
        sort_order: Optional[int] = None,
    ) -> None:
        if question is not None:
            self.question = question
        if answer is not None:
            self.answer = answer
        if sort_order is not None:
            self.sort_order = sort_order
        self.updated_at = datetime.utcnow()
