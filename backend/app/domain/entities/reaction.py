"""Reaction entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4


class ReactionType(str, Enum):
    """Types of reactions available."""
    LIKE = "like"
    DISLIKE = "dislike"
    INSIGHT = "insight"


@dataclass
class Reaction:
    """Domain entity representing a reaction (👍 👎 💡) on problems or ideas."""
    target_id: UUID  # ID of problem or idea
    target_type: str  # 'problem' or 'idea'
    type: ReactionType
    user_id: UUID
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def change_type(self, new_type: ReactionType) -> None:
        """Change reaction type."""
        self.type = new_type
