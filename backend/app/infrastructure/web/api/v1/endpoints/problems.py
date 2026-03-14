"""Problem endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.problem_dto import (
    CreateProblemDTO,
    UpdateProblemDTO,
    ProblemListFiltersDTO,
    ProblemResponseDTO,
    ProblemListResponseDTO
)
from app.application.use_cases.problem.create_problem import CreateProblemUseCase
from app.application.use_cases.problem.update_problem import UpdateProblemUseCase
from app.application.use_cases.problem.list_problems import ListProblemsUseCase
from app.application.use_cases.problem.delete_problem import DeleteProblemUseCase
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("", response_model=ProblemListResponseDTO)
async def list_problems(
    filters: ProblemListFiltersDTO = Depends(),
    page: int = 1,
    limit: int = 20,
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo)
):
    """List problems with pagination and filters."""
    use_case = ListProblemsUseCase(problem_repo)
    return await use_case.execute(filters, page, limit)


@router.post("", response_model=ProblemResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_problem(
    data: CreateProblemDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo)
):
    """Create a new problem."""
    use_case = CreateProblemUseCase(problem_repo)
    return await use_case.execute(data, current_user.id)


@router.get("/{problem_id}", response_model=ProblemResponseDTO)
async def get_problem(
    problem_id: UUID,
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo)
):
    """Get a problem by ID."""
    problem = await problem_repo.get_by_id(problem_id)
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )
    return ProblemResponseDTO.model_validate(problem)


@router.patch("/{problem_id}", response_model=ProblemResponseDTO)
async def update_problem(
    problem_id: UUID,
    data: UpdateProblemDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo)
):
    """Update a problem."""
    use_case = UpdateProblemUseCase(problem_repo)
    return await use_case.execute(
        problem_id,
        data,
        current_user.id,
        current_user.role == "admin"
    )


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_problem(
    problem_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo)
):
    """Delete a problem."""
    use_case = DeleteProblemUseCase(problem_repo)
    success = await use_case.execute(
        problem_id,
        current_user.id,
        current_user.role == "admin"
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )
    return None
