"""EventAward repository interfaces."""
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.event_award import EventAward, EventAwardTeam


class EventAwardRepository(ABC):

    @abstractmethod
    async def get_by_id(self, award_id: UUID) -> Optional[EventAward]:
        ...

    @abstractmethod
    async def list_by_event(self, event_id: UUID) -> List[EventAward]:
        ...

    @abstractmethod
    async def create(self, award: EventAward) -> EventAward:
        ...

    @abstractmethod
    async def update(self, award: EventAward) -> EventAward:
        ...

    @abstractmethod
    async def delete(self, award_id: UUID) -> None:
        ...


class EventAwardTeamRepository(ABC):

    @abstractmethod
    async def list_by_award(self, award_id: UUID) -> List[EventAwardTeam]:
        ...

    @abstractmethod
    async def list_by_event(self, event_id: UUID) -> List[EventAwardTeam]:
        ...

    @abstractmethod
    async def add_team(self, entry: EventAwardTeam) -> EventAwardTeam:
        ...

    @abstractmethod
    async def remove_team(self, award_id: UUID, team_id: UUID) -> None:
        ...

    @abstractmethod
    async def remove_all_by_award(self, award_id: UUID) -> None:
        ...
