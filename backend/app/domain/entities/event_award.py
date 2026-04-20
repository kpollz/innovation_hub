"""EventAward entities - Pure business logic."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class EventAward:
    """Domain entity representing an award tier for an event."""
    event_id: UUID
    name: str
    rank_order: int
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    def update(
        self,
        name: Optional[str] = None,
        rank_order: Optional[int] = None,
    ) -> None:
        if name is not None:
            self.name = name
        if rank_order is not None:
            self.rank_order = rank_order
        self.updated_at = datetime.utcnow()


@dataclass
class EventAwardTeam:
    """Domain entity linking a team to an award."""
    award_id: UUID
    team_id: UUID
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
