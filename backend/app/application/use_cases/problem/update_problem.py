"""Update problem use case."""
from uuid import UUID

from app.application.dto.problem_dto import UpdateProblemDTO, ProblemResponseDTO
from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.problem_repository import ProblemRepository


class UpdateProblemUseCase:
    """Use case: Update an existing problem."""
    
    def __init__(self, problem_repo: ProblemRepository):
        self.problem_repo = problem_repo
    
    async def execute(
        self,
        problem_id: UUID,
        dto: UpdateProblemDTO,
        current_user_id: UUID,
        is_admin: bool = False
    ) -> ProblemResponseDTO:
        """
        Execute the use case.
        
        Args:
            problem_id: ID of problem to update
            dto: Update data
            current_user_id: ID of user making the request
            is_admin: Whether the user is an admin
            
        Returns:
            Updated problem as DTO
        """
        # Get existing problem
        problem = await self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise NotFoundException(f"Problem {problem_id} not found")
        
        # Authorization check
        if problem.author_id != current_user_id and not is_admin:
            raise ForbiddenException("You can only update your own problems")
        
        # Update fields
        if dto.title:
            problem.title = dto.title
        if dto.content:
            problem.content = dto.content
        if dto.category:
            problem.category = dto.category
        if dto.status:
            problem.transition_to(dto.status)  # Business rule enforced here
        
        # Persist
        updated = await self.problem_repo.update(problem)
        
        return ProblemResponseDTO.model_validate(updated)
