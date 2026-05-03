"""SQLAlchemy implementation of ChatMessageRepository."""
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.chat_message import ChatMessage
from app.domain.repositories.chat_message_repository import ChatMessageRepository
from app.domain.value_objects.chat_role import ChatRole
from app.infrastructure.database.models.chat_message_model import ChatMessageModel


class SQLChatMessageRepository(ChatMessageRepository):
    """SQLAlchemy implementation of ChatMessageRepository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ChatMessageModel) -> ChatMessage:
        """Map ORM model to domain entity."""
        return ChatMessage(
            id=UUID(model.id),
            session_id=UUID(model.session_id),
            role=ChatRole(model.role),
            content=model.content,
            sources=model.sources,
            created_at=model.created_at,
        )

    def _to_model(self, entity: ChatMessage) -> ChatMessageModel:
        """Map domain entity to ORM model."""
        return ChatMessageModel(
            id=str(entity.id),
            session_id=str(entity.session_id),
            role=entity.role.value,
            content=entity.content,
            sources=entity.sources,
            created_at=entity.created_at,
        )

    async def save(self, message: ChatMessage) -> ChatMessage:
        model = self._to_model(message)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def list_by_session(self, session_id: UUID) -> List[ChatMessage]:
        result = await self.session.execute(
            select(ChatMessageModel)
            .where(ChatMessageModel.session_id == str(session_id))
            .order_by(ChatMessageModel.created_at.asc())
        )
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]
