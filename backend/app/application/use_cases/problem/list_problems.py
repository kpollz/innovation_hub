"""List problems use case."""
from app.application.dto.problem_dto import (
    ProblemListFiltersDTO,
    ProblemListResponseDTO,
    ProblemResponseDTO
)
from app.domain.repositories.problem_repository import ProblemRepository


class ListProblemsUseCase:
    """Use case: List problems with pagination and filters."""
    
    def __init__(self, problem_repo: ProblemRepository):
        self.problem_repo = problem_repo
    
    async def execute(
        self,
        filters: ProblemListFiltersDTO,
        page: int = 1,
        limit: int = 20
    ) -> ProblemListResponseDTO:
        """
        Execute the use case.
        
        Args:
            filters: Filter criteria
            page: Page number
            limit: Items per page
            
        Returns:
            Paginated list of problems
        """
        # Build filter dict
        filter_dict = {}
        if filters.status:
            filter_dict["status"] = filters.status
        if filters.category:
            filter_dict["category"] = filters.category
        if filters.author_id:
            filter_dict["author_id"] = filters.author_id
        if filters.search:
            filter_dict["search"] = filters.search
        
        # Query repository
        problems, total = await self.problem_repo.list(
            filters=filter_dict,
            page=page,
            limit=limit
        )
        
        # Convert to DTOs
        problem_dtos = [
            ProblemResponseDTO.model_validate(p) for p in problems
        ]
        
        return ProblemListResponseDTO(
            items=problem_dtos,
            total=total,
            page=page,
            limit=limit
        )
