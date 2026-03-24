"""Notification repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.notification import Notification


class NotificationRepository(ABC):
    """Abstract interface for notification persistence operations."""

    @abstractmethod
    async def get_by_id(self, notification_id: UUID) -> Optional[Notification]:
        """Get notification by ID."""
        pass

    @abstractmethod
    async def list_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        limit: int = 5,
        unread_only: bool = False
    ) -> Tuple[List[Notification], int]:
        """List notifications for a user, ordered by created_at DESC."""
        pass

    @abstractmethod
    async def create(self, notification: Notification) -> Notification:
        """Create a new notification."""
        pass

    @abstractmethod
    async def create_bulk(self, notifications: List[Notification]) -> List[Notification]:
        """Create multiple notifications at once."""
        pass

    @abstractmethod
    async def mark_read(self, notification_id: UUID) -> bool:
        """Mark a single notification as read."""
        pass

    @abstractmethod
    async def mark_all_read(self, user_id: UUID) -> int:
        """Mark all notifications as read for a user. Returns count updated."""
        pass

    @abstractmethod
    async def count_unread(self, user_id: UUID) -> int:
        """Count unread notifications for a user."""
        pass
