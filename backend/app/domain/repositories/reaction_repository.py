"""Reaction repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from app.domain.entities.reaction import Reaction, ReactionType


class ReactionRepository(ABC):
    """Abstract interface for reaction persistence operations."""
    
    @abstractmethod
    async def get_by_id(self, reaction_id: UUID) -> Optional[Reaction]:
        """Get reaction by ID."""
        pass
    
    @abstractmethod
    async def get_by_user_and_target(
        self,
        user_id: UUID,
        target_id: UUID,
        target_type: str
    ) -> Optional[Reaction]:
        """Get reaction by user and target (unique constraint)."""
        pass
    
    @abstractmethod
    async def list_by_target(
        self,
        target_id: UUID,
        target_type: str,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Reaction], int]:
        """List reactions for a target."""
        pass
    
    @abstractmethod
    async def count_by_type(
        self,
        target_id: UUID,
        target_type: str,
        reaction_type: ReactionType
    ) -> int:
        """Count reactions of a specific type for a target."""
        pass
    
    @abstractmethod
    async def get_counts_by_target(
        self,
        target_id: UUID,
        target_type: str
    ) -> Dict[ReactionType, int]:
        """Get all reaction counts for a target."""
        pass
    
    @abstractmethod
    async def create(self, reaction: Reaction) -> Reaction:
        """Create new reaction."""
        pass
    
    @abstractmethod
    async def update(self, reaction: Reaction) -> Reaction:
        """Update existing reaction."""
        pass
    
    @abstractmethod
    async def delete(self, reaction_id: UUID) -> bool:
        """Delete reaction."""
        pass
    
    @abstractmethod
    async def delete_by_target(self, target_id: UUID, target_type: str) -> bool:
        """Delete all reactions for a target."""
        pass
