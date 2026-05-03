"""Chat session service - use cases for chat session management."""
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import HTTPException, status

from app.application.dto.chat_dto import (
    MessageResponseDTO,
    SendMessageDTO,
    SessionResponseDTO,
)
from app.domain.entities.chat_message import ChatMessage
from app.domain.entities.chat_session import ChatSession
from app.domain.value_objects.chat_role import ChatRole


class ChatSessionService:
    """Orchestrates chat session and message operations."""

    async def create_session(
        self,
        session_repo,
        user_id: UUID,
        title: str,
    ) -> SessionResponseDTO:
        session = ChatSession(user_id=user_id, title=title)
        saved = await session_repo.create(session)
        return SessionResponseDTO(
            id=saved.id,
            title=saved.title,
            created_at=saved.created_at,
            updated_at=saved.updated_at,
        )

    async def list_sessions(
        self,
        session_repo,
        user_id: UUID,
    ) -> List[SessionResponseDTO]:
        sessions = await session_repo.list_by_user(user_id)
        return [
            SessionResponseDTO(
                id=s.id,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in sessions
        ]

    async def rename_session(
        self,
        session_repo,
        session_id: UUID,
        user_id: UUID,
        title: str,
    ) -> SessionResponseDTO:
        session = await session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if not session.is_owned_by(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

        session.rename(title)
        updated = await session_repo.update(session)
        return SessionResponseDTO(
            id=updated.id,
            title=updated.title,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )

    async def delete_session(
        self,
        session_repo,
        session_id: UUID,
        user_id: UUID,
    ) -> None:
        session = await session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if not session.is_owned_by(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

        await session_repo.delete(session_id)

    async def get_messages(
        self,
        session_repo,
        message_repo,
        session_id: UUID,
        user_id: UUID,
    ) -> List[MessageResponseDTO]:
        session = await session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if not session.is_owned_by(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

        messages = await message_repo.list_by_session(session_id)
        return [
            MessageResponseDTO(
                id=m.id,
                role=m.role.value,
                content=m.content,
                sources=m.sources,
                created_at=m.created_at,
            )
            for m in messages
        ]

    async def save_message(
        self,
        message_repo,
        session_id: UUID,
        role: ChatRole,
        content: str,
        sources: dict = None,
    ) -> MessageResponseDTO:
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            sources=sources,
        )
        saved = await message_repo.save(message)
        return MessageResponseDTO(
            id=saved.id,
            role=saved.role.value,
            content=saved.content,
            sources=saved.sources,
            created_at=saved.created_at,
        )
