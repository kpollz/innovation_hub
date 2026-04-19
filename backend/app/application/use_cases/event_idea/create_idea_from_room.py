"""Create event idea from brainstorming room (linked) use case."""
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException
from app.domain.entities.event_idea import EventIdea
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_team_repository import EventTeamRepository
from app.domain.repositories.idea_repository import IdeaRepository
from app.domain.repositories.room_repository import RoomRepository
from app.domain.repositories.problem_repository import ProblemRepository
from app.application.use_cases.event_idea.html_to_tiptap import html_to_tiptap


class CreateEventIdeaFromRoomUseCase:
    """Copy an idea from a brainstorming room into an event."""

    def __init__(
        self,
        event_repo: EventRepository,
        team_repo: EventTeamRepository,
        idea_repo: EventIdeaRepository,
        room_idea_repo: IdeaRepository,
        room_repo: RoomRepository,
        problem_repo: ProblemRepository,
    ):
        self.event_repo = event_repo
        self.team_repo = team_repo
        self.idea_repo = idea_repo
        self.room_idea_repo = room_idea_repo
        self.room_repo = room_repo
        self.problem_repo = problem_repo

    async def execute(
        self,
        event_id: UUID,
        room_id: UUID,
        source_idea_id: UUID,
        user_id: UUID,
        is_admin: bool = False,
    ) -> EventIdea:
        # Validate event exists and is active
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")
        if not event.is_active():
            raise ForbiddenException("Cannot submit idea: event is not active")

        # User must be in a team in this event
        membership = await self.team_repo.get_member_by_user_and_event(user_id, event_id)
        if not membership or not membership.is_active():
            raise ForbiddenException("You must be an active member of a team in this event")
        team_id = membership.team_id

        # Validate room exists
        room = await self.room_repo.get_by_id(room_id)
        if not room:
            raise NotFoundException(f"Room {room_id} not found")

        # Validate source idea exists and belongs to the room
        source_idea = await self.room_idea_repo.get_by_id(source_idea_id)
        if not source_idea:
            raise NotFoundException(f"Idea {source_idea_id} not found")
        if source_idea.room_id != room_id:
            raise ForbiddenException("Idea does not belong to the specified room")

        # Check room visibility — user must have access
        if not room.is_visible_to(user_id):
            raise ForbiddenException("You do not have permission to view this room")

        # Resolve linked problem (if any) → user_problem
        # Only include problem content if user has access to it
        source_problem_id = None
        user_problem = None
        if room.problem_id:
            problem = await self.problem_repo.get_by_id(room.problem_id)
            if problem and problem.is_visible_to(user_id, is_admin):
                source_problem_id = problem.id
                user_problem = html_to_tiptap(problem.content)

        # Mapping: room idea → event idea
        title = source_idea.title
        solution = html_to_tiptap(source_idea.description)

        event_idea = EventIdea(
            event_id=event_id,
            team_id=team_id,
            title=title,
            user_problem=user_problem,
            solution=solution,
            source_type="linked",
            source_problem_id=source_problem_id,
            source_room_id=room_id,
            source_idea_id=source_idea_id,
            author_id=user_id,
        )

        return await self.idea_repo.create(event_idea)
