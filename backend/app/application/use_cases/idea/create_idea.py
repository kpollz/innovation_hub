"""Create idea use case."""
from uuid import UUID

from app.application.dto.idea_dto import CreateIdeaDTO
from app.domain.entities.idea import Idea
from app.domain.repositories.idea_repository import IdeaRepository
from app.domain.repositories.room_repository import RoomRepository
from app.core.exceptions import NotFoundException


class CreateIdeaUseCase:
    """Use case: Create a new idea in a room."""

    def __init__(self, idea_repo: IdeaRepository, room_repo: RoomRepository):
        self.idea_repo = idea_repo
        self.room_repo = room_repo

    async def execute(self, dto: CreateIdeaDTO, author_id: UUID) -> Idea:
        """Create a new idea and return the domain entity."""
        room = await self.room_repo.get_by_id(dto.room_id)
        if not room:
            raise NotFoundException(f"Room {dto.room_id} not found")

        idea = Idea(
            room_id=dto.room_id,
            title=dto.title,
            description=dto.description,
            outcome=dto.outcome,
            author_id=author_id,
        )
        return await self.idea_repo.create(idea)
