"""Vote entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class Vote:
    """Domain entity representing a star vote (1-5) on an idea."""
    idea_id: UUID
    user_id: UUID
    stars: int
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    MIN_STARS = 1
    MAX_STARS = 5
    
    def __post_init__(self):
        """Validate stars value after initialization."""
        if not (self.MIN_STARS <= self.stars <= self.MAX_STARS):
            raise ValueError(
                f"Stars must be between {self.MIN_STARS} and {self.MAX_STARS}"
            )
    
    def update_stars(self, new_stars: int) -> None:
        """Update vote stars."""
        if not (self.MIN_STARS <= new_stars <= self.MAX_STARS):
            raise ValueError(
                f"Stars must be between {self.MIN_STARS} and {self.MAX_STARS}"
            )
        self.stars = new_stars
        self.updated_at = datetime.utcnow()
