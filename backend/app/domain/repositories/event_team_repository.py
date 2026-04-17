"""Event Team repository interface (Port)."""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.event_team import EventTeam, EventTeamMember


class EventTeamRepository(ABC):
    """Abstract interface for event team persistence operations."""

    # --- Team operations ---
    @abstractmethod
    async def get_team_by_id(self, team_id: UUID) -> Optional[EventTeam]:
        pass

    @abstractmethod
    async def list_teams_by_event(
        self, event_id: UUID, page: int = 1, limit: int = 20
    ) -> Tuple[List[EventTeam], int]:
        pass

    @abstractmethod
    async def create_team(self, team: EventTeam) -> EventTeam:
        pass

    @abstractmethod
    async def update_team(self, team: EventTeam) -> EventTeam:
        pass

    @abstractmethod
    async def delete_team(self, team_id: UUID) -> bool:
        pass

    @abstractmethod
    async def get_member_count(self, team_id: UUID) -> int:
        """Count active members in a team."""
        pass

    @abstractmethod
    async def get_idea_count(self, team_id: UUID) -> int:
        """Count ideas submitted by a team."""
        pass

    # --- Member operations ---
    @abstractmethod
    async def get_member(self, member_id: UUID) -> Optional[EventTeamMember]:
        pass

    @abstractmethod
    async def get_team_members(
        self, team_id: UUID, status: Optional[str] = None
    ) -> List[EventTeamMember]:
        pass

    @abstractmethod
    async def add_member(self, member: EventTeamMember) -> EventTeamMember:
        pass

    @abstractmethod
    async def update_member(self, member: EventTeamMember) -> EventTeamMember:
        pass

    @abstractmethod
    async def remove_member(self, member_id: UUID) -> bool:
        pass

    @abstractmethod
    async def get_member_by_user_and_event(
        self, user_id: UUID, event_id: UUID
    ) -> Optional[EventTeamMember]:
        """Get a user's membership record in an event (any status)."""
        pass

    @abstractmethod
    async def get_active_member_by_user_and_team(
        self, user_id: UUID, team_id: UUID
    ) -> Optional[EventTeamMember]:
        """Get a user's active membership in a specific team."""
        pass

    @abstractmethod
    async def get_member_by_user_and_team(
        self, user_id: UUID, team_id: UUID
    ) -> Optional[EventTeamMember]:
        """Get a user's membership (any status) in a specific team."""
        pass

    # --- Review assignment cleanup ---
    @abstractmethod
    async def clear_review_assignments_for_team(self, team_id: UUID) -> List[UUID]:
        """Clear assigned_to_team_id pointing to or from this team.
        Returns list of affected team IDs."""
        pass
