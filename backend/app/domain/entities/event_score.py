"""EventScore entity."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class EventScore:
    """Domain entity representing a team's score for an event idea."""
    event_idea_id: UUID
    scorer_team_id: UUID
    criteria_scores: dict  # {criteria_id: score}
    total_score: float
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
