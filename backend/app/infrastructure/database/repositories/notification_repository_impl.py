"""SQLAlchemy implementation of NotificationRepository."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.notification import Notification
from app.domain.repositories.notification_repository import NotificationRepository
from app.infrastructure.database.models.notification_model import NotificationModel


class SQLNotificationRepository(NotificationRepository):
    """SQLAlchemy implementation of NotificationRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: NotificationModel) -> Notification:
        """Map ORM model to domain entity."""
        return Notification(
            id=UUID(model.id),
            user_id=UUID(model.user_id),
            actor_id=UUID(model.actor_id),
            type=model.type,
            target_id=UUID(model.target_id),
            target_type=model.target_type,
            target_title=model.target_title,
            action_detail=model.action_detail,
            reference_id=UUID(model.reference_id) if model.reference_id else None,
            is_read=model.is_read,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: Notification) -> NotificationModel:
        """Map domain entity to ORM model."""
        return NotificationModel(
            id=str(entity.id),
            user_id=str(entity.user_id),
            actor_id=str(entity.actor_id),
            type=entity.type,
            target_id=str(entity.target_id),
            target_type=entity.target_type,
            target_title=entity.target_title,
            action_detail=entity.action_detail,
            reference_id=str(entity.reference_id) if entity.reference_id else None,
            is_read=entity.is_read,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def get_by_id(self, notification_id: UUID) -> Optional[Notification]:
        result = await self.session.execute(
            select(NotificationModel).where(NotificationModel.id == str(notification_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        limit: int = 5,
        unread_only: bool = False,
    ) -> Tuple[List[Notification], int]:
        query = select(NotificationModel).where(
            NotificationModel.user_id == str(user_id)
        )
        if unread_only:
            query = query.where(NotificationModel.is_read == False)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        # Pagination
        query = query.order_by(NotificationModel.created_at.desc())
        query = query.offset((page - 1) * limit).limit(limit)

        result = await self.session.execute(query)
        models = result.scalars().all()

        return [self._to_entity(m) for m in models], total

    async def create(self, notification: Notification) -> Notification:
        model = self._to_model(notification)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def create_bulk(self, notifications: List[Notification]) -> List[Notification]:
        if not notifications:
            return []
        models = [self._to_model(n) for n in notifications]
        self.session.add_all(models)
        await self.session.flush()
        for model in models:
            await self.session.refresh(model)
        await self.session.commit()
        return [self._to_entity(m) for m in models]

    async def mark_read(self, notification_id: UUID) -> bool:
        model = await self.session.get(NotificationModel, str(notification_id))
        if model:
            model.is_read = True
            await self.session.flush()
            await self.session.commit()
            return True
        return False

    async def mark_all_read(self, user_id: UUID) -> int:
        result = await self.session.execute(
            update(NotificationModel)
            .where(NotificationModel.user_id == str(user_id))
            .where(NotificationModel.is_read == False)
            .values(is_read=True)
            .returning(NotificationModel.id)
        )
        await self.session.flush()
        await self.session.commit()
        return len(result.all())

    async def count_unread(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(NotificationModel)
            .where(NotificationModel.user_id == str(user_id))
            .where(NotificationModel.is_read == False)
        )
        return result.scalar() or 0
