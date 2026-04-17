"""Event dashboard endpoints."""
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.application.dto.event_dashboard_dto import DashboardIdeaListDTO, DashboardTeamListDTO
from app.application.use_cases.event_dashboard.ideas_leaderboard import IdeasLeaderboardUseCase
from app.application.use_cases.event_dashboard.teams_leaderboard import TeamsLeaderboardUseCase
from app.core.exceptions import NotFoundException
from app.infrastructure.database.repositories.event_repository_impl import SQLEventRepository
from app.infrastructure.database.repositories.event_idea_repository_impl import SQLEventIdeaRepository
from app.infrastructure.database.repositories.event_team_repository_impl import SQLEventTeamRepository
from app.infrastructure.database.repositories.event_score_repository_impl import SQLEventScoreRepository
from app.infrastructure.database.repositories.event_scoring_criteria_repository_impl import SQLEventScoringCriteriaRepository
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


@router.get("/dashboard/ideas", response_model=DashboardIdeaListDTO)
async def ideas_leaderboard(
    event_id: UUID,
    team_id: Optional[UUID] = Query(None),
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    idea_repo: SQLEventIdeaRepository = Depends(deps.get_event_idea_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    score_repo: SQLEventScoreRepository = Depends(deps.get_event_score_repo),
    criteria_repo: SQLEventScoringCriteriaRepository = Depends(deps.get_event_scoring_criteria_repo),
):
    """Ideas ranked by total_score DESC. Unsocrd ideas at bottom."""
    use_case = IdeasLeaderboardUseCase(event_repo, idea_repo, team_repo, score_repo, criteria_repo)
    try:
        return await use_case.execute(event_id, team_id)
    except NotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/dashboard/teams", response_model=DashboardTeamListDTO)
async def teams_leaderboard(
    event_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    idea_repo: SQLEventIdeaRepository = Depends(deps.get_event_idea_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
    score_repo: SQLEventScoreRepository = Depends(deps.get_event_score_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """Teams ranked by idea_count DESC, then avg_score DESC."""
    use_case = TeamsLeaderboardUseCase(event_repo, idea_repo, team_repo, score_repo, user_repo)
    try:
        return await use_case.execute(event_id)
    except NotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
