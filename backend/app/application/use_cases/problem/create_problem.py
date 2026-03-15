"""Create problem use case."""
from uuid import UUID

from app.application.dto.problem_dto import CreateProblemDTO, ProblemResponseDTO
from app.domain.entities.problem import Problem
from app.domain.repositories.problem_repository import ProblemRepository


class CreateProblemUseCase:
    """Use case: Create a new problem."""
    
    def __init__(self, problem_repo: ProblemRepository):
        self.problem_repo = problem_repo
    
    async def execute(
        self,
        dto: CreateProblemDTO,
        author_id: UUID
    ) -> ProblemResponseDTO:
        """
        Execute the use case.
        
        Args:
            dto: Creation data
            author_id: ID of the user creating the problem
            
        Returns:
            Created problem as DTO
        """
        # Create domain entity
        problem = Problem(
            title=dto.title,
            summary=dto.summary,
            content=dto.content,
            category=dto.category,
            author_id=author_id
        )
        
        # Persist via repository
        created_problem = await self.problem_repo.create(problem)
        
        # Return as DTO
        return ProblemResponseDTO.model_validate(created_problem)
