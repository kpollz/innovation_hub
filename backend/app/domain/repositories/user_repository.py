"""User repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.user import User


class UserRepository(ABC):
    """Abstract interface for user persistence operations."""
    
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        pass
    
    @abstractmethod
    async def get_by_ids(self, user_ids: List[UUID]) -> List[User]:
        """Get multiple users by their IDs."""
        pass

    @abstractmethod
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[User], int]:
        """List users with pagination. Returns (items, total_count)."""
        pass
    
    @abstractmethod
    async def create(self, user: User) -> User:
        """Create new user."""
        pass
    
    @abstractmethod
    async def update(self, user: User) -> User:
        """Update existing user."""
        pass
    
    @abstractmethod
    async def delete(self, user_id: UUID) -> bool:
        """Delete user."""
        pass
