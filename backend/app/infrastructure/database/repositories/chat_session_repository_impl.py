"""SQLAlchemy implementation of ChatSessionRepository."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.chat_session import ChatSession
from app.domain.repositories.chat_session_repository import ChatSessionRepository
from app.infrastructure.database.models.chat_session_model import ChatSessionModel


class SQLChatSessionRepository(ChatSessionRepository):
    """SQLAlchemy implementation of ChatSessionRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ChatSessionModel) -> ChatSession:
        """Map ORM model to domain entity."""
        return ChatSession(
            id=UUID(model.id),
            user_id=UUID(model.user_id),
            title=model.title,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: ChatSession) -> ChatSessionModel:
        """Map domain entity to ORM model."""
        return ChatSessionModel(
            id=str(entity.id),
            user_id=str(entity.user_id),
            title=entity.title,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def get_by_id(self, session_id: UUID) -> Optional[ChatSession]:
        result = await self.session.execute(
            select(ChatSessionModel).where(ChatSessionModel.id == str(session_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_user(self, user_id: UUID) -> List[ChatSession]:
        result = await self.session.execute(
            select(ChatSessionModel)
            .where(ChatSessionModel.user_id == str(user_id))
            .order_by(ChatSessionModel.updated_at.desc().nulls_last(), ChatSessionModel.created_at.desc())
        )
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def create(self, chat_session: ChatSession) -> ChatSession:
        model = self._to_model(chat_session)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def update(self, chat_session: ChatSession) -> ChatSession:
        model = await self.session.get(ChatSessionModel, str(chat_session.id))
        if not model:
            raise ValueError(f"ChatSession {chat_session.id} not found")

        model.title = chat_session.title
        model.updated_at = chat_session.updated_at

        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def delete(self, session_id: UUID) -> bool:
        model = await self.session.get(ChatSessionModel, str(session_id))
        if not model:
            return False

        await self.session.delete(model)
        await self.session.flush()
        await self.session.commit()
        return True
