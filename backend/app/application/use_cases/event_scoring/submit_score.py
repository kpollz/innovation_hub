"""Submit score use case."""
from typing import Optional
from uuid import UUID

from app.core.exceptions import ForbiddenException, NotFoundException, ValidationException
from app.domain.entities.event_score import EventScore
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_score_repository import EventScoreRepository
from app.domain.repositories.event_scoring_criteria_repository import EventScoringCriteriaRepository
from app.domain.repositories.event_team_repository import EventTeamRepository

VALID_LIKERT_SCORES = {2.5, 5.0, 7.5, 10.0, 12.5}


class SubmitScoreUseCase:

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
        criteria_notes: Optional[dict[str, Optional[str]]],
        user_id: UUID,
    ) -> EventScore:
        # Validate event
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")
        if not event.is_active():
            raise ForbiddenException("Cannot score: event is not active")

        # Validate idea exists and belongs to event
        idea = await self.idea_repo.get_by_id(idea_id)
        if not idea:
            raise NotFoundException(f"Idea {idea_id} not found")
        if idea.event_id != event_id:
            raise NotFoundException(f"Idea {idea_id} not found in this event")

        # User must be team lead of a team in this event
        membership = await self.team_repo.get_member_by_user_and_event(user_id, event_id)
        if not membership or not membership.is_active():
            raise ForbiddenException("You must be an active team member in this event")

        team = await self.team_repo.get_team_by_id(membership.team_id)
        if not team or not team.is_leader(user_id):
            raise ForbiddenException("Only team leads can score ideas")

        # Team must be assigned to review the idea's team
        idea_team = await self.team_repo.get_team_by_id(idea.team_id)
        if not idea_team:
            raise NotFoundException("Idea's team not found")

        if team.assigned_to_team_id != idea.team_id:
            raise ForbiddenException("Your team is not assigned to review this idea's team")

        # Cannot score own team's idea
        if membership.team_id == idea.team_id:
            raise ForbiddenException("Cannot score your own team's idea")

        # Check not already scored
        existing = await self.score_repo.get_by_idea_and_team(idea_id, membership.team_id)
        if existing:
            raise ForbiddenException("Your team has already scored this idea")

        # Validate criteria
        all_criteria = await self.criteria_repo.list_by_event(event_id)
        if not all_criteria:
            raise ValidationException("No scoring criteria defined for this event")

        criteria_map = {str(c.id): c for c in all_criteria}
        provided_ids = set(criteria_scores.keys())
        expected_ids = set(criteria_map.keys())

        if provided_ids != expected_ids:
            raise ValidationException(
                f"Must provide scores for all {len(expected_ids)} criteria. "
                f"Missing: {expected_ids - provided_ids}"
            )

        # Validate each score is a valid Likert value and within max_score
        for cid, score in criteria_scores.items():
            if score not in VALID_LIKERT_SCORES:
                raise ValidationException(
                    f"Invalid score {score} for criteria {cid}. "
                    f"Must be one of: {sorted(VALID_LIKERT_SCORES)}"
                )
            criteria = criteria_map[cid]
            if score > criteria.max_score:
                raise ValidationException(
                    f"Score {score} exceeds max_score {criteria.max_score} for criteria {cid}"
                )

        # Validate notes if provided
        validated_notes: Optional[dict[str, Optional[str]]] = None
        if criteria_notes is not None:
            validated_notes = {}
            for cid, note in criteria_notes.items():
                if cid not in criteria_map:
                    raise ValidationException(f"Note references unknown criteria: {cid}")
                if note is not None and len(note) > 500:
                    raise ValidationException(f"Note for criteria {cid} exceeds 500 characters")
                validated_notes[cid] = note.strip() if note else None

        # Calculate total score
        total = sum(
            criteria_scores[str(c.id)] * c.weight
            for c in all_criteria
        )

        score = EventScore(
            event_idea_id=idea_id,
            scorer_team_id=membership.team_id,
            criteria_scores=criteria_scores,
            criteria_notes=validated_notes,
            total_score=total,
        )

        return await self.score_repo.create(score)
