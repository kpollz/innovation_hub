"""Chat endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.application.dto.chat_dto import (
    CreateSessionDTO,
    MessageResponseDTO,
    RenameSessionDTO,
    SendMessageDTO,
    SessionResponseDTO,
)
from app.application.services.chat_session_service import ChatSessionService
from app.domain.value_objects.chat_role import ChatRole
from app.infrastructure.database.repositories.chat_session_repository_impl import SQLChatSessionRepository
from app.infrastructure.database.repositories.chat_message_repository_impl import SQLChatMessageRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()
service = ChatSessionService()


@router.post("/sessions", response_model=SessionResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_session(
    data: CreateSessionDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session_repo: SQLChatSessionRepository = Depends(deps.get_chat_session_repo),
):
    """Create a new chat session."""
    return await service.create_session(session_repo, current_user.id, data.title)


@router.get("/sessions", response_model=List[SessionResponseDTO])
async def list_sessions(
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session_repo: SQLChatSessionRepository = Depends(deps.get_chat_session_repo),
):
    """List current user's chat sessions."""
    return await service.list_sessions(session_repo, current_user.id)


@router.patch("/sessions/{session_id}", response_model=SessionResponseDTO)
async def rename_session(
    session_id: UUID,
    data: RenameSessionDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session_repo: SQLChatSessionRepository = Depends(deps.get_chat_session_repo),
):
    """Rename a chat session."""
    return await service.rename_session(session_repo, session_id, current_user.id, data.title)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session_repo: SQLChatSessionRepository = Depends(deps.get_chat_session_repo),
):
    """Delete a chat session (cascade deletes messages)."""
    await service.delete_session(session_repo, session_id, current_user.id)
    return None


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponseDTO])
async def get_messages(
    session_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session_repo: SQLChatSessionRepository = Depends(deps.get_chat_session_repo),
    message_repo: SQLChatMessageRepository = Depends(deps.get_chat_message_repo),
):
    """Get message history for a session."""
    return await service.get_messages(session_repo, message_repo, session_id, current_user.id)


@router.post("/sessions/{session_id}/message", response_model=MessageResponseDTO)
async def send_message(
    session_id: UUID,
    data: SendMessageDTO,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    session_repo: SQLChatSessionRepository = Depends(deps.get_chat_session_repo),
    message_repo: SQLChatMessageRepository = Depends(deps.get_chat_message_repo),
):
    """Send a message to a session. Skeleton for now — SSE streaming in Phase C."""
    # Verify session exists and belongs to user
    session = await session_repo.get_by_id(session_id)
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if not session.is_owned_by(current_user.id):
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

    # Save user message to DB
    return await service.save_message(
        message_repo, session_id, ChatRole.USER, data.content
    )
