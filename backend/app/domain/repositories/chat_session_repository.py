"""ChatSession repository interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.chat_session import ChatSession


class ChatSessionRepository(ABC):
    """Abstract interface for chat session persistence operations."""

    @abstractmethod
    async def get_by_id(self, session_id: UUID) -> Optional[ChatSession]:
        """Get session by ID."""
        pass

    @abstractmethod
    async def list_by_user(self, user_id: UUID) -> List[ChatSession]:
        """List all sessions belonging to a user."""
        pass

    @abstractmethod
    async def create(self, session: ChatSession) -> ChatSession:
        """Create new session."""
        pass

    @abstractmethod
    async def update(self, session: ChatSession) -> ChatSession:
        """Update session (e.g. rename)."""
        pass

    @abstractmethod
    async def delete(self, session_id: UUID) -> bool:
        """Delete session (cascade deletes messages)."""
        pass
