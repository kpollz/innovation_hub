"""Ideas leaderboard use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_score_repository import EventScoreRepository
from app.domain.repositories.event_scoring_criteria_repository import EventScoringCriteriaRepository
from app.domain.repositories.event_team_repository import EventTeamRepository


class IdeasLeaderboardUseCase:

    def __init__(
        self,
        event_repo: EventRepository,
        idea_repo: EventIdeaRepository,
        team_repo: EventTeamRepository,
        score_repo: EventScoreRepository,
        criteria_repo: EventScoringCriteriaRepository,
    ):
        self.event_repo = event_repo
        self.idea_repo = idea_repo
        self.team_repo = team_repo
        self.score_repo = score_repo
        self.criteria_repo = criteria_repo

    async def execute(self, event_id: UUID, team_id: UUID | None = None) -> dict:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        # Get all ideas (optionally filtered by team)
        ideas, _ = await self.idea_repo.list_by_event(
            event_id, team_id=team_id, sort="newest", page=1, limit=1000
        )

        # Build criteria name map for breakdown labels
        all_criteria = await self.criteria_repo.list_by_event(event_id)
        criteria_names = {str(c.id): c.name for c in all_criteria}

        items = []
        for idea in ideas:
            team = await self.team_repo.get_team_by_id(idea.team_id)
            scores = await self.score_repo.list_by_idea(idea.id)

            total_score = None
            criteria_breakdown = {}

            if scores:
                total_score = sum(s.total_score for s in scores) / len(scores)
                total_score = round(total_score, 2)
                # Aggregate criteria averages
                all_cids = set()
                for s in scores:
                    all_cids.update(s.criteria_scores.keys())
                for cid in all_cids:
                    vals = [s.criteria_scores.get(cid, 0) for s in scores]
                    avg = round(sum(vals) / len(vals), 2)
                    label = criteria_names.get(cid, cid)
                    criteria_breakdown[label] = avg

            items.append({
                "id": idea.id,
                "title": idea.title,
                "team": {"id": team.id, "name": team.name} if team else None,
                "author": {"id": idea.author_id},
                "total_score": total_score,
                "score_count": len(scores),
                "criteria_breakdown": criteria_breakdown,
                "created_at": idea.created_at,
            })

        # Sort: scored first (DESC by total_score), unscored last
        scored = [i for i in items if i["total_score"] is not None]
        unscored = [i for i in items if i["total_score"] is None]
        scored.sort(key=lambda x: x["total_score"], reverse=True)

        return {"items": scored + unscored}
