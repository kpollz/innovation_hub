"""Vote idea use case."""
from uuid import UUID

from app.application.dto.vote_dto import CreateVoteDTO, VoteResponseDTO
from app.domain.entities.vote import Vote
from app.domain.repositories.vote_repository import VoteRepository
from app.domain.repositories.idea_repository import IdeaRepository
from app.core.exceptions import NotFoundException, ConflictException


class VoteIdeaUseCase:
    """Use case: Vote on an idea."""
    
    def __init__(
        self,
        vote_repo: VoteRepository,
        idea_repo: IdeaRepository
    ):
        self.vote_repo = vote_repo
        self.idea_repo = idea_repo
    
    async def execute(
        self,
        dto: CreateVoteDTO,
        user_id: UUID
    ) -> VoteResponseDTO:
        """
        Execute the use case.
        
        Creates a new vote or updates existing one.
        """
        # Verify idea exists
        idea = await self.idea_repo.get_by_id(dto.idea_id)
        if not idea:
            raise NotFoundException(f"Idea {dto.idea_id} not found")
        
        # Check if user already voted
        existing_vote = await self.vote_repo.get_by_user_and_idea(
            user_id=user_id,
            idea_id=dto.idea_id
        )
        
        if existing_vote:
            # Update existing vote
            existing_vote.update_stars(dto.stars)
            updated_vote = await self.vote_repo.update(existing_vote)
            return VoteResponseDTO.model_validate(updated_vote)
        
        # Create new vote
        vote = Vote(
            idea_id=dto.idea_id,
            user_id=user_id,
            stars=dto.stars
        )
        
        created_vote = await self.vote_repo.create(vote)
        return VoteResponseDTO.model_validate(created_vote)
