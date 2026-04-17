"""List scores use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_score_repository import EventScoreRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class ListScoresUseCase:

    def __init__(
        self,
        event_repo: EventRepository,
        idea_repo: EventIdeaRepository,
        team_repo: EventTeamRepository,
        score_repo: EventScoreRepository,
    ):
        self.event_repo = event_repo
        self.idea_repo = idea_repo
        self.team_repo = team_repo
        self.score_repo = score_repo

    async def execute(self, event_id: UUID, idea_id: UUID) -> dict:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        idea = await self.idea_repo.get_by_id(idea_id)
        if not idea:
            raise NotFoundException(f"Idea {idea_id} not found")
        if idea.event_id != event_id:
            raise NotFoundException(f"Idea not found in this event")

        scores = await self.score_repo.list_by_idea(idea_id)

        # Enrich with team info
        enriched_scores = []
        for score in scores:
            team = await self.team_repo.get_team_by_id(score.scorer_team_id)
            score_dict = {
                "id": score.id,
                "event_idea_id": score.event_idea_id,
                "scorer_team_id": score.scorer_team_id,
                "scorer_team": {"id": team.id, "name": team.name} if team else None,
                "criteria_scores": score.criteria_scores,
                "total_score": score.total_score,
                "created_at": score.created_at,
                "updated_at": score.updated_at,
            }
            enriched_scores.append(score_dict)

        # Calculate summary
        total_avg = 0.0
        criteria_avg = {}
        if scores:
            total_avg = sum(s.total_score for s in scores) / len(scores)
            # Aggregate criteria averages
            all_criteria_ids = set()
            for s in scores:
                all_criteria_ids.update(s.criteria_scores.keys())
            for cid in all_criteria_ids:
                vals = [s.criteria_scores.get(cid, 0) for s in scores]
                criteria_avg[cid] = round(sum(vals) / len(vals), 2)
            total_avg = round(total_avg, 2)

        return {
            "idea_id": idea_id,
            "scores": enriched_scores,
            "summary": {
                "total_avg": total_avg,
                "criteria_avg": criteria_avg,
            },
        }
