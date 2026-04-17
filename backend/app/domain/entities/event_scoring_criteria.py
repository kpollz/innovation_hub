"""EventScoringCriteria entity."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class EventScoringCriteria:
    """Domain entity representing a scoring criterion for an event."""
    event_id: UUID
    group: str  # "problem" | "solution"
    name: str
    id: UUID = field(default_factory=uuid4)
    description: Optional[str] = None
    weight: float = 1.0
    max_score: float = 12.5
    sort_order: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
