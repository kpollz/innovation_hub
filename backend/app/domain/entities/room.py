"""Room entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from app.domain.value_objects.status import RoomStatus


@dataclass
class Room:
    """Domain entity representing a brainstorming room (Idea Lab)."""
    name: str
    created_by: UUID
    id: UUID = field(default_factory=uuid4)
    problem_id: Optional[UUID] = None
    description: Optional[str] = None
    status: RoomStatus = field(default=RoomStatus.ACTIVE)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    def archive(self) -> None:
        """Archive the room."""
        self.status = RoomStatus.ARCHIVED
        self.updated_at = datetime.utcnow()
    
    def activate(self) -> None:
        """Reactivate the room."""
        self.status = RoomStatus.ACTIVE
        self.updated_at = datetime.utcnow()
    
    def update(self, name: Optional[str] = None, description: Optional[str] = None) -> None:
        """Update room information."""
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        self.updated_at = datetime.utcnow()
    
    def is_active(self) -> bool:
        """Check if room is active."""
        return self.status == RoomStatus.ACTIVE
