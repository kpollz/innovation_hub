"""Create event idea (manual) use case."""
from uuid import UUID

from app.application.dto.event_idea_dto import CreateEventIdeaDTO
from app.core.exceptions import ForbiddenException, NotFoundException, ConflictException
from app.domain.entities.event_idea import EventIdea
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class CreateEventIdeaUseCase:
    """Submit an idea via manual form."""

    def __init__(
        self,
        event_repo: EventRepository,
        team_repo: EventTeamRepository,
        idea_repo: EventIdeaRepository,
    ):
        self.event_repo = event_repo
        self.team_repo = team_repo
        self.idea_repo = idea_repo

    async def execute(
        self, event_id: UUID, dto: CreateEventIdeaDTO, user_id: UUID
    ) -> EventIdea:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if not event.is_active():
            raise ForbiddenException("Cannot submit idea: event is not active")

        # Find user's active team in this event
        membership = await self.team_repo.get_member_by_user_and_event(user_id, event_id)
        if not membership or not membership.is_active():
            raise ForbiddenException("You must be an active member of a team in this event")

        team_id = membership.team_id

        # Verify the team still exists
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundException("Team not found")

        idea = EventIdea(
            event_id=event_id,
            team_id=team_id,
            title=dto.title,
            user_problem=dto.user_problem,
            user_scenarios=dto.user_scenarios,
            user_expectation=dto.user_expectation,
            research=dto.research,
            solution=dto.solution,
            source_type=dto.source_type,
            author_id=user_id,
        )

        return await self.idea_repo.create(idea)
