"""ChatMessage entity - Pure business logic, no infrastructure dependencies."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from app.domain.value_objects.chat_role import ChatRole


@dataclass
class ChatMessage:
    """Domain entity representing a message in a chat session."""
    session_id: UUID
    role: ChatRole
    content: str
    id: UUID = field(default_factory=uuid4)
    sources: Optional[Dict[str, Any]] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

    def is_user_message(self) -> bool:
        """Check if this is a user message."""
        return self.role == ChatRole.USER

    def is_assistant_message(self) -> bool:
        """Check if this is an assistant message."""
        return self.role == ChatRole.ASSISTANT
