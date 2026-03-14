"""Delete problem use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.problem_repository import ProblemRepository


class DeleteProblemUseCase:
    """Use case: Delete a problem."""
    
    def __init__(self, problem_repo: ProblemRepository):
        self.problem_repo = problem_repo
    
    async def execute(
        self,
        problem_id: UUID,
        current_user_id: UUID,
        is_admin: bool = False
    ) -> bool:
        """
        Execute the use case.
        
        Args:
            problem_id: ID of problem to delete
            current_user_id: ID of user making the request
            is_admin: Whether the user is an admin
            
        Returns:
            True if deleted successfully
        """
        # Get existing problem
        problem = await self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise NotFoundException(f"Problem {problem_id} not found")
        
        # Authorization check
        if problem.author_id != current_user_id and not is_admin:
            raise ForbiddenException("You can only delete your own problems")
        
        # Delete
        return await self.problem_repo.delete(problem_id)
