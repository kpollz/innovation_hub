"""EventTeam entity - Pure business logic."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class EventTeam:
    """Domain entity representing a team in an event."""
    event_id: UUID
    name: str
    leader_id: UUID
    id: UUID = field(default_factory=uuid4)
    slogan: Optional[str] = None
    assigned_to_team_id: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    def is_leader(self, user_id: UUID) -> bool:
        """Check if user is the team leader."""
        return self.leader_id == user_id

    def update(self, name: Optional[str] = None, slogan: Optional[str] = None) -> None:
        """Update team fields."""
        if name is not None:
            self.name = name
        if slogan is not None:
            self.slogan = slogan
        self.updated_at = datetime.utcnow()

    def assign_review(self, target_team_id: UUID) -> None:
        """Assign this team to review another team."""
        self.assigned_to_team_id = target_team_id
        self.updated_at = datetime.utcnow()

    def clear_review_assignment(self) -> None:
        """Clear this team's review assignment."""
        self.assigned_to_team_id = None
        self.updated_at = datetime.utcnow()


@dataclass
class EventTeamMember:
    """Domain entity representing a team member."""
    team_id: UUID
    user_id: UUID
    event_id: UUID
    id: UUID = field(default_factory=uuid4)
    status: str = "pending"  # pending | active | rejected
    joined_at: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    def approve(self) -> None:
        """Approve membership request."""
        self.status = "active"
        self.joined_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def reject(self) -> None:
        """Reject membership request."""
        self.status = "rejected"
        self.updated_at = datetime.utcnow()

    def is_active(self) -> bool:
        """Check if member is active."""
        return self.status == "active"

    def is_pending(self) -> bool:
        """Check if membership request is pending."""
        return self.status == "pending"
