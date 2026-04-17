"""Teams leaderboard use case."""
from uuid import UUID

from app.core.exceptions import NotFoundException
from app.domain.repositories.event_idea_repository import EventIdeaRepository
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_score_repository import EventScoreRepository
from app.domain.repositories.event_team_repository import EventTeamRepository
from app.domain.repositories.user_repository import UserRepository


class TeamsLeaderboardUseCase:

    def __init__(
        self,
        event_repo: EventRepository,
        idea_repo: EventIdeaRepository,
        team_repo: EventTeamRepository,
        score_repo: EventScoreRepository,
        user_repo: UserRepository,
    ):
        self.event_repo = event_repo
        self.idea_repo = idea_repo
        self.team_repo = team_repo
        self.score_repo = score_repo
        self.user_repo = user_repo

    async def execute(self, event_id: UUID) -> dict:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        teams, _ = await self.team_repo.list_teams_by_event(event_id, page=1, limit=1000)

        items = []
        for team in teams:
            ideas, _ = await self.idea_repo.list_by_event(
                event_id, team_id=team.id, sort="newest", page=1, limit=1000
            )
            idea_count = len(ideas)

            score_values = []
            for idea in ideas:
                scores = await self.score_repo.list_by_idea(idea.id)
                if scores:
                    avg = sum(s.total_score for s in scores) / len(scores)
                    score_values.append(avg)

            avg_score = round(sum(score_values) / len(score_values), 2) if score_values else None
            total_score = round(sum(score_values), 2) if score_values else 0.0

            members = await self.team_repo.get_team_members(team.id, status="active")
            member_list = []
            for m in members:
                user = await self.user_repo.get_by_id(m.user_id)
                if user:
                    member_list.append({
                        "id": str(user.id),
                        "username": user.username,
                        "full_name": user.full_name,
                        "avatar_url": user.avatar_url,
                    })

            items.append({
                "team": {"id": team.id, "name": team.name, "slogan": team.slogan},
                "idea_count": idea_count,
                "avg_score": avg_score,
                "total_score": total_score,
                "members": member_list,
            })

        # Sort: idea_count DESC, then avg_score DESC
        items.sort(key=lambda x: (x["idea_count"], x["avg_score"] or 0), reverse=True)

        return {"items": items}
