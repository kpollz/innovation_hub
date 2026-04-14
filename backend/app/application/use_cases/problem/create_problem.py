"""Create problem use case."""
from uuid import UUID

from app.application.dto.problem_dto import CreateProblemDTO
from app.domain.entities.problem import Problem
from app.domain.repositories.problem_repository import ProblemRepository
from app.domain.value_objects.visibility import Visibility


class CreateProblemUseCase:
    """Use case: Create a new problem."""

    def __init__(self, problem_repo: ProblemRepository):
        self.problem_repo = problem_repo

    async def execute(
        self,
        dto: CreateProblemDTO,
        author_id: UUID,
    ) -> Problem:
        """Create a new problem and return the domain entity."""
        shared_user_ids = dto.shared_user_ids or []
        # If shared_user_ids provided, auto-set visibility to private
        visibility = dto.visibility
        if shared_user_ids and visibility == Visibility.PUBLIC:
            visibility = Visibility.PRIVATE

        problem = Problem(
            title=dto.title,
            summary=dto.summary,
            content=dto.content,
            category=dto.category,
            author_id=author_id,
            visibility=visibility,
            shared_user_ids=shared_user_ids,
        )
        return await self.problem_repo.create(problem)