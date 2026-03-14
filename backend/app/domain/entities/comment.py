"""Comment entity - Pure business logic, no infrastructure dependencies."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class Comment:
    """Domain entity representing a comment on problems or ideas.
    
    Supports threaded comments (nested replies).
    """
    target_id: UUID  # ID of problem or idea
    target_type: str  # 'problem' or 'idea'
    content: str
    author_id: UUID
    id: UUID = field(default_factory=uuid4)
    parent_id: Optional[UUID] = None  # For threaded replies
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    def update_content(self, new_content: str) -> None:
        """Update comment content."""
        self.content = new_content
        self.updated_at = datetime.utcnow()
    
    def is_reply(self) -> bool:
        """Check if this comment is a reply to another comment."""
        return self.parent_id is not None
    
    @classmethod
    def create_reply(
        cls,
        parent_id: UUID,
        target_id: UUID,
        target_type: str,
        content: str,
        author_id: UUID
    ) -> "Comment":
        """Factory method to create a reply comment."""
        return cls(
            target_id=target_id,
            target_type=target_type,
            content=content,
            author_id=author_id,
            parent_id=parent_id
        )
