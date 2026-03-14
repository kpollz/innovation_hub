"""Update idea use case."""
from uuid import UUID

from app.application.dto.idea_dto import UpdateIdeaDTO, IdeaResponseDTO
from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.idea_repository import IdeaRepository


class UpdateIdeaUseCase:
    """Use case: Update an existing idea."""
    
    def __init__(self, idea_repo: IdeaRepository):
        self.idea_repo = idea_repo
    
    async def execute(
        self,
        idea_id: UUID,
        dto: UpdateIdeaDTO,
        current_user_id: UUID,
        is_admin: bool = False
    ) -> IdeaResponseDTO:
        """Execute the use case."""
        idea = await self.idea_repo.get_by_id(idea_id)
        if not idea:
            raise NotFoundException(f"Idea {idea_id} not found")
        
        # Authorization check
        if idea.author_id != current_user_id and not is_admin:
            raise ForbiddenException("You can only update your own ideas")
        
        # Update fields
        if dto.title:
            idea.title = dto.title
        if dto.description:
            idea.description = dto.description
        if dto.outcome is not None:
            idea.outcome = dto.outcome
        if dto.status:
            idea.transition_to(dto.status)
        if dto.is_pinned is not None:
            if dto.is_pinned:
                idea.pin()
            else:
                idea.unpin()
        
        updated = await self.idea_repo.update(idea)
        return IdeaResponseDTO.model_validate(updated)
