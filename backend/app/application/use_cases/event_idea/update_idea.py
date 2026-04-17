"""Update event idea use case."""
from uuid import UUID

from app.application.dto.event_idea_dto import UpdateEventIdeaDTO
from app.core.exceptions import ForbiddenException, NotFoundException
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class UpdateEventIdeaUseCase:
    """Edit an idea. Author or Team Lead of the idea's team."""

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
        self,
        event_id: UUID,
        idea_id: UUID,
        dto: UpdateEventIdeaDTO,
        user_id: UUID,
        is_admin: bool = False,
    ):
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if not event.is_active():
            raise ForbiddenException("Cannot edit idea: event is not active")

        idea = await self.idea_repo.get_by_id(idea_id)
        if not idea:
            raise NotFoundException(f"Idea {idea_id} not found")

        if idea.event_id != event_id:
            raise NotFoundException(f"Idea {idea_id} not found in event {event_id}")

        # Permission: author, team lead of the idea's team, or admin
        is_author = idea.author_id == user_id
        team = await self.team_repo.get_team_by_id(idea.team_id)
        is_team_lead = team and team.is_leader(user_id)

        if not is_admin and not is_author and not is_team_lead:
            raise ForbiddenException("Only the author, team lead, or admin can edit this idea")

        # Build update kwargs (only non-None fields)
        update_kwargs = {}
        if dto.title is not None:
            update_kwargs["title"] = dto.title
        if dto.user_problem is not None:
            update_kwargs["user_problem"] = dto.user_problem
        if dto.user_scenarios is not None:
            update_kwargs["user_scenarios"] = dto.user_scenarios
        if dto.user_expectation is not None:
            update_kwargs["user_expectation"] = dto.user_expectation
        if dto.research is not None:
            update_kwargs["research"] = dto.research
        if dto.solution is not None:
            update_kwargs["solution"] = dto.solution

        if update_kwargs:
            idea.update(**update_kwargs)
            return await self.idea_repo.update(idea)

        return idea
