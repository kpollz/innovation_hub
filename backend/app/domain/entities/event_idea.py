"""EventIdea entity - Pure business logic."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class EventIdea:
    """Domain entity representing an idea submitted to an event."""
    event_id: UUID
    team_id: UUID
    title: str
    solution: dict  # TipTap JSON (required)
    author_id: UUID
    id: UUID = field(default_factory=uuid4)
    user_problem: Optional[dict] = None
    user_scenarios: Optional[dict] = None
    user_expectation: Optional[dict] = None
    research: Optional[dict] = None
    source_type: str = "manual"  # manual | linked
    source_problem_id: Optional[UUID] = None
    source_room_id: Optional[UUID] = None
    source_idea_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    def update(
        self,
        title: Optional[str] = None,
        user_problem: Optional[dict] = None,
        user_scenarios: Optional[dict] = None,
        user_expectation: Optional[dict] = None,
        research: Optional[dict] = None,
        solution: Optional[dict] = None,
    ) -> None:
        """Update editable fields."""
        if title is not None:
            self.title = title
        if user_problem is not None:
            self.user_problem = user_problem
        if user_scenarios is not None:
            self.user_scenarios = user_scenarios
        if user_expectation is not None:
            self.user_expectation = user_expectation
        if research is not None:
            self.research = research
        if solution is not None:
            self.solution = solution
        self.updated_at = datetime.utcnow()
