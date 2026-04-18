"""Assign review target use case — Admin assigns which team reviews which."""
from typing import Optional
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException, ValidationException
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class AssignReviewUseCase:
    """Admin assigns team to review another team, or clears the assignment."""

    def __init__(self, event_repo: EventRepository, team_repo: EventTeamRepository):
        self.event_repo = event_repo
        self.team_repo = team_repo

    async def execute(
        self,
        event_id: UUID,
        team_id: UUID,
        target_team_id: Optional[UUID],
        current_user_id: UUID,
        is_admin: bool = False,
    ):
        """Assign team to review target_team, or clear if target_team_id is None."""
        if not is_admin:
            raise ForbiddenException("Only admins can assign review targets")

        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if event.is_closed():
            raise ForbiddenException("Cannot assign reviews: event is closed")

        # Validate reviewer team
        team = await self.team_repo.get_team_by_id(team_id)
        if not team or team.event_id != event_id:
            raise NotFoundException(f"Team {team_id} not found in event {event_id}")

        # Clear assignment
        if not target_team_id:
            team.clear_review_assignment()
            return await self.team_repo.update_team(team)

        # Validate target team
        target = await self.team_repo.get_team_by_id(target_team_id)
        if not target or target.event_id != event_id:
            raise NotFoundException(f"Target team {target_team_id} not found in event {event_id}")

        # Cannot review itself
        if team_id == target_team_id:
            raise ValidationException("A team cannot review itself")

        # Target team can only be reviewed by one team
        all_teams, _ = await self.team_repo.list_teams_by_event(event_id, page=1, limit=100)
        existing_reviewer = next(
            (t for t in all_teams
             if t.assigned_to_team_id and str(t.assigned_to_team_id) == str(target_team_id)
             and str(t.id) != str(team_id)),
            None,
        )
        if existing_reviewer:
            raise ValidationException(
                f"Team '{target.name}' is already being reviewed by '{existing_reviewer.name}'"
            )

        team.assign_review(target_team_id)
        updated = await self.team_repo.update_team(team)
        return updated
