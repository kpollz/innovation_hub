"""SQLAlchemy implementation of EventTeamRepository."""
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_team import EventTeam, EventTeamMember
from app.domain.repositories.event_team_repository import EventTeamRepository
from app.infrastructure.database.models.event_team_model import EventTeamModel, EventTeamMemberModel


class SQLEventTeamRepository(EventTeamRepository):
    """SQLAlchemy implementation of EventTeamRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # --- Mapping helpers ---

    def _to_team_entity(self, model: EventTeamModel) -> EventTeam:
        return EventTeam(
            id=UUID(model.id),
            event_id=UUID(model.event_id),
            name=model.name,
            slogan=model.slogan,
            leader_id=UUID(model.leader_id),
            assigned_to_team_id=UUID(model.assigned_to_team_id) if model.assigned_to_team_id else None,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_team_model(self, entity: EventTeam) -> EventTeamModel:
        return EventTeamModel(
            id=str(entity.id),
            event_id=str(entity.event_id),
            name=entity.name,
            slogan=entity.slogan,
            leader_id=str(entity.leader_id),
            assigned_to_team_id=str(entity.assigned_to_team_id) if entity.assigned_to_team_id else None,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def _to_member_entity(self, model: EventTeamMemberModel) -> EventTeamMember:
        return EventTeamMember(
            id=UUID(model.id),
            team_id=UUID(model.team_id),
            user_id=UUID(model.user_id),
            event_id=UUID(model.event_id),
            status=model.status,
            joined_at=model.joined_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_member_model(self, entity: EventTeamMember) -> EventTeamMemberModel:
        return EventTeamMemberModel(
            id=str(entity.id),
            team_id=str(entity.team_id),
            user_id=str(entity.user_id),
            event_id=str(entity.event_id),
            status=entity.status,
            joined_at=entity.joined_at,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    # --- Team operations ---

    async def get_team_by_id(self, team_id: UUID) -> Optional[EventTeam]:
        result = await self.session.execute(
            select(EventTeamModel).where(EventTeamModel.id == str(team_id))
        )
        model = result.scalar_one_or_none()
        return self._to_team_entity(model) if model else None

    async def list_teams_by_event(
        self, event_id: UUID, page: int = 1, limit: int = 20
    ) -> Tuple[List[EventTeam], int]:
        query = select(EventTeamModel).where(
            EventTeamModel.event_id == str(event_id)
        )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        # Sort by newest first
        query = query.order_by(desc(EventTeamModel.created_at))

        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)

        result = await self.session.execute(query)
        models = result.scalars().all()
        return [self._to_team_entity(m) for m in models], total

    async def create_team(self, team: EventTeam) -> EventTeam:
        model = self._to_team_model(team)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_team_entity(model)

    async def update_team(self, team: EventTeam) -> EventTeam:
        model = await self.session.get(EventTeamModel, str(team.id))
        if not model:
            raise ValueError(f"Team {team.id} not found")

        model.name = team.name
        model.slogan = team.slogan
        model.leader_id = str(team.leader_id)
        model.assigned_to_team_id = str(team.assigned_to_team_id) if team.assigned_to_team_id else None
        model.updated_at = team.updated_at

        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_team_entity(model)

    async def delete_team(self, team_id: UUID) -> bool:
        model = await self.session.get(EventTeamModel, str(team_id))
        if not model:
            return False
        await self.session.delete(model)
        await self.session.flush()
        await self.session.commit()
        return True

    async def get_member_count(self, team_id: UUID) -> int:
        result = await self.session.scalar(
            select(func.count()).where(
                EventTeamMemberModel.team_id == str(team_id),
                EventTeamMemberModel.status == "active",
            )
        )
        return result or 0

    async def get_idea_count(self, team_id: UUID) -> int:
        from app.infrastructure.database.models.event_idea_model import EventIdeaModel
        result = await self.session.scalar(
            select(func.count()).where(EventIdeaModel.team_id == str(team_id))
        )
        return result or 0

    # --- Member operations ---

    async def get_member(self, member_id: UUID) -> Optional[EventTeamMember]:
        result = await self.session.execute(
            select(EventTeamMemberModel).where(
                EventTeamMemberModel.id == str(member_id)
            )
        )
        model = result.scalar_one_or_none()
        return self._to_member_entity(model) if model else None

    async def get_team_members(
        self, team_id: UUID, status: Optional[str] = None
    ) -> List[EventTeamMember]:
        query = select(EventTeamMemberModel).where(
            EventTeamMemberModel.team_id == str(team_id)
        )
        if status:
            query = query.where(EventTeamMemberModel.status == status)

        result = await self.session.execute(query)
        models = result.scalars().all()
        return [self._to_member_entity(m) for m in models]

    async def add_member(self, member: EventTeamMember) -> EventTeamMember:
        model = self._to_member_model(member)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_member_entity(model)

    async def update_member(self, member: EventTeamMember) -> EventTeamMember:
        model = await self.session.get(EventTeamMemberModel, str(member.id))
        if not model:
            raise ValueError(f"Member {member.id} not found")

        model.status = member.status
        model.joined_at = member.joined_at
        model.updated_at = member.updated_at

        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_member_entity(model)

    async def remove_member(self, member_id: UUID) -> bool:
        model = await self.session.get(EventTeamMemberModel, str(member_id))
        if not model:
            return False
        await self.session.delete(model)
        await self.session.flush()
        await self.session.commit()
        return True

    async def get_member_by_user_and_event(
        self, user_id: UUID, event_id: UUID
    ) -> Optional[EventTeamMember]:
        result = await self.session.execute(
            select(EventTeamMemberModel).where(
                EventTeamMemberModel.user_id == str(user_id),
                EventTeamMemberModel.event_id == str(event_id),
            )
        )
        model = result.scalar_one_or_none()
        return self._to_member_entity(model) if model else None

    async def get_active_member_by_user_and_team(
        self, user_id: UUID, team_id: UUID
    ) -> Optional[EventTeamMember]:
        result = await self.session.execute(
            select(EventTeamMemberModel).where(
                EventTeamMemberModel.user_id == str(user_id),
                EventTeamMemberModel.team_id == str(team_id),
                EventTeamMemberModel.status == "active",
            )
        )
        model = result.scalar_one_or_none()
        return self._to_member_entity(model) if model else None

    async def get_member_by_user_and_team(
        self, user_id: UUID, team_id: UUID
    ) -> Optional[EventTeamMember]:
        result = await self.session.execute(
            select(EventTeamMemberModel).where(
                EventTeamMemberModel.user_id == str(user_id),
                EventTeamMemberModel.team_id == str(team_id),
            )
        )
        model = result.scalar_one_or_none()
        return self._to_member_entity(model) if model else None

    # --- Review assignment cleanup ---

    async def clear_review_assignments_for_team(self, team_id: UUID) -> List[UUID]:
        """Clear all assigned_to_team_id references to/from this team."""
        affected_ids: List[UUID] = []

        # 1. Clear teams that this team was assigned to review
        team = await self.session.get(EventTeamModel, str(team_id))
        if team and team.assigned_to_team_id:
            affected_ids.append(UUID(team.assigned_to_team_id))
            team.assigned_to_team_id = None

        # 2. Clear teams that were assigned to review this team
        result = await self.session.execute(
            select(EventTeamModel).where(
                EventTeamModel.assigned_to_team_id == str(team_id)
            )
        )
        for reviewer_model in result.scalars().all():
            reviewer_model.assigned_to_team_id = None
            affected_ids.append(UUID(reviewer_model.id))

        if affected_ids:
            await self.session.flush()
            await self.session.commit()

        return affected_ids
