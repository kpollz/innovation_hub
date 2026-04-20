"""List awards use case."""
from uuid import UUID

from app.application.dto.event_award_dto import AwardResponse, AwardTeamResponse, AwardListResponse
from app.core.exceptions import NotFoundException
from app.domain.repositories.event_award_repository import EventAwardRepository, EventAwardTeamRepository
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_team_repository import EventTeamRepository
from app.domain.repositories.user_repository import UserRepository


class ListAwardsUseCase:

    def __init__(
        self,
        event_repo: EventRepository,
        award_repo: EventAwardRepository,
        award_team_repo: EventAwardTeamRepository,
        team_repo: EventTeamRepository,
        user_repo: UserRepository,
    ):
        self.event_repo = event_repo
        self.award_repo = award_repo
        self.award_team_repo = award_team_repo
        self.team_repo = team_repo
        self.user_repo = user_repo

    async def execute(self, event_id: UUID) -> AwardListResponse:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        awards = await self.award_repo.list_by_event(event_id)
        items = []
        for award in awards:
            award_teams = await self.award_team_repo.list_by_award(award.id)
            team_responses = []
            for at in award_teams:
                team = await self.team_repo.get_team_by_id(at.team_id)
                if not team:
                    continue
                leader = await self.user_repo.get_by_id(team.leader_id)
                team_responses.append(AwardTeamResponse(
                    team_id=at.team_id,
                    team_name=team.name,
                    team_slogan=team.slogan,
                    leader_id=team.leader_id,
                    leader_name=leader.full_name if leader else None,
                    leader_avatar_url=leader.avatar_url if leader else None,
                ))
            items.append(AwardResponse(
                id=award.id,
                event_id=award.event_id,
                name=award.name,
                rank_order=award.rank_order,
                teams=team_responses,
                created_at=award.created_at,
                updated_at=award.updated_at,
            ))
        return AwardListResponse(items=items)
