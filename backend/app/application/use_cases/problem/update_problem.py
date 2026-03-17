"""Update problem use case."""
from uuid import UUID

from app.application.dto.problem_dto import UpdateProblemDTO
from app.core.exceptions import NotFoundException, ForbiddenException
from app.domain.entities.problem import Problem
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
        is_admin: bool = False,
    ) -> Problem:
        """Update and return the domain entity."""
        problem = await self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise NotFoundException(f"Problem {problem_id} not found")

        if problem.author_id != current_user_id and not is_admin:
            raise ForbiddenException("You can only update your own problems")

        if dto.title is not None:
            problem.title = dto.title
        if dto.summary is not None:
            problem.summary = dto.summary
        if dto.content is not None:
            problem.content = dto.content
        if dto.category is not None:
            problem.category = dto.category
        if dto.status is not None:
            problem.transition_to(dto.status)

        return await self.problem_repo.update(problem)
