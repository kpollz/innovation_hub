"""Update score use case."""
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException, ValidationException
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_score_repository import EventScoreRepository
from app.domain.repositories.event_scoring_criteria_repository import EventScoringCriteriaRepository
from app.domain.repositories.event_team_repository import EventTeamRepository

VALID_LIKERT_SCORES = {2.5, 5.0, 7.5, 10.0, 12.5}


class UpdateScoreUseCase:

    def __init__(
        self,
        event_repo: EventRepository,
        idea_repo: EventIdeaRepository,
        team_repo: EventTeamRepository,
        criteria_repo: EventScoringCriteriaRepository,
        score_repo: EventScoreRepository,
    ):
        self.event_repo = event_repo
        self.idea_repo = idea_repo
        self.team_repo = team_repo
        self.criteria_repo = criteria_repo
        self.score_repo = score_repo

    async def execute(
        self,
        event_id: UUID,
        idea_id: UUID,
        criteria_scores: dict[str, float],
        user_id: UUID,
    ) -> "EventScore":
        from app.domain.entities.event_score import EventScore

        # Validate event
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")
        if not event.is_active():
            raise ForbiddenException("Cannot update score: event is not active")

        # User must be team lead
        membership = await self.team_repo.get_member_by_user_and_event(user_id, event_id)
        if not membership or not membership.is_active():
            raise ForbiddenException("You must be an active team member in this event")

        team = await self.team_repo.get_team_by_id(membership.team_id)
        if not team or not team.is_leader(user_id):
            raise ForbiddenException("Only team leads can update scores")

        # Find existing score
        existing = await self.score_repo.get_by_idea_and_team(idea_id, membership.team_id)
        if not existing:
            raise NotFoundException("No existing score found to update")

        # Validate criteria
        all_criteria = await self.criteria_repo.list_by_event(event_id)
        criteria_map = {str(c.id): c for c in all_criteria}
        provided_ids = set(criteria_scores.keys())
        expected_ids = set(criteria_map.keys())

        if provided_ids != expected_ids:
            raise ValidationException(
                f"Must provide scores for all {len(expected_ids)} criteria."
            )

        for cid, score in criteria_scores.items():
            if score not in VALID_LIKERT_SCORES:
                raise ValidationException(
                    f"Invalid score {score}. Must be one of: {sorted(VALID_LIKERT_SCORES)}"
                )
            if score > criteria_map[cid].max_score:
                raise ValidationException(f"Score exceeds max for criteria {cid}")

        total = sum(criteria_scores[str(c.id)] * c.weight for c in all_criteria)

        existing.criteria_scores = criteria_scores
        existing.total_score = total

        return await self.score_repo.update(existing)
