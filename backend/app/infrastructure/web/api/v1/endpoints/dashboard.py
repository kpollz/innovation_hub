"""Dashboard endpoints - Admin only."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.infrastructure.web.api import deps
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository
from app.infrastructure.database.repositories.idea_repository_impl import SQLIdeaRepository
from app.infrastructure.database.repositories.comment_repository_impl import SQLCommentRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository

router = APIRouter()


class DashboardStats(BaseModel):
    total_problems: int
    total_ideas: int
    total_comments: int
    total_users: int
    interaction_rate: float
    new_this_week: int
    resolved_problems: int


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    current_user = Depends(deps.get_current_user),
    problem_repo: SQLProblemRepository = Depends(deps.get_problem_repo),
    idea_repo: SQLIdeaRepository = Depends(deps.get_idea_repo),
    comment_repo: SQLCommentRepository = Depends(deps.get_comment_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo)
):
    """Get dashboard statistics - Admin only."""
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get counts
    problems = await problem_repo.list({}, page=1, limit=1000)
    ideas = await idea_repo.list({}, page=1, limit=1000)
    comments = await comment_repo.list({}, page=1, limit=1000)
    users = await user_repo.list({}, page=1, limit=1000)
    
    return DashboardStats(
        total_problems=problems[1],
        total_ideas=ideas[1],
        total_comments=comments[1],
        total_users=users[1],
        interaction_rate=0.0,
        new_this_week=0,
        resolved_problems=0
    )