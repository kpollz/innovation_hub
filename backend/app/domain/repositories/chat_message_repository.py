"""ChatMessage repository interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.chat_message import ChatMessage


class ChatMessageRepository(ABC):
    """Abstract interface for chat message persistence operations."""

    @abstractmethod
    async def save(self, message: ChatMessage) -> ChatMessage:
        """Save a message."""
        pass

    @abstractmethod
    async def list_by_session(self, session_id: UUID) -> List[ChatMessage]:
        """List all messages in a session, ordered by created_at."""
        pass
