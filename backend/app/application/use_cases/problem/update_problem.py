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
            from app.domain.value_objects.status import ProblemStatus as PS
            # discussing/brainstorming are auto-transitions only
            auto_only = {PS.DISCUSSING, PS.BRAINSTORMING}
            if dto.status in auto_only:
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"'{dto.status.value}' is auto-transitioned by the system and cannot be set manually"
                )
            if not problem.can_transition_to(dto.status):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot transition from '{problem.status.value}' to '{dto.status.value}'"
                )
            problem.transition_to(dto.status)

        # Handle privacy updates (only author or admin can change)
        if dto.visibility is not None or dto.shared_user_ids is not None:
            problem.update_privacy(
                visibility=dto.visibility,
                shared_user_ids=dto.shared_user_ids,
            )

        return await self.problem_repo.update(problem)
