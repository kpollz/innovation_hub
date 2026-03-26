"""Notification endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.notification_dto import (
    NotificationActorDTO,
    NotificationResponseDTO,
    NotificationListResponseDTO,
)
from app.infrastructure.database.repositories.notification_repository_impl import (
    SQLNotificationRepository,
)
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


async def _enrich_notification(notification, user_repo: SQLUserRepository) -> NotificationResponseDTO:
    """Enrich a notification entity with actor info."""
    dto = NotificationResponseDTO(
        id=notification.id,
        user_id=notification.user_id,
        actor_id=notification.actor_id,
        type=notification.type,
        target_id=notification.target_id,
        target_type=notification.target_type,
        target_title=notification.target_title,
        action_detail=notification.action_detail,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )
    actor = await user_repo.get_by_id(notification.actor_id)
    if actor:
        dto.actor = NotificationActorDTO(
            id=actor.id,
            username=actor.username,
            full_name=actor.full_name,
            avatar_url=actor.avatar_url,
        )
    return dto


@router.get("", response_model=NotificationListResponseDTO)
async def list_notifications(
    page: int = 1,
    limit: int = 5,
    unread_only: bool = False,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
):
    """List notifications for the current user."""
    notifications, total = await notification_repo.list_by_user(
        current_user.id, page, limit, unread_only
    )
    unread_count = await notification_repo.count_unread(current_user.id)

    items = []
    for n in notifications:
        items.append(await _enrich_notification(n, user_repo))

    return NotificationListResponseDTO(
        items=items, total=total, page=page, limit=limit, unread_count=unread_count
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: UserResponseDTO = Depends(get_current_active_user),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
):
    """Get unread notification count for badge display."""
    count = await notification_repo.count_unread(current_user.id)
    return {"count": count}


@router.patch("/read-all")
async def mark_all_read(
    current_user: UserResponseDTO = Depends(get_current_active_user),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
):
    """Mark all notifications as read for the current user."""
    updated = await notification_repo.mark_all_read(current_user.id)
    return {"updated": updated}


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    notification_repo: SQLNotificationRepository = Depends(deps.get_notification_repo),
):
    """Mark a single notification as read."""
    notification = await notification_repo.get_by_id(notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your notification")
    await notification_repo.mark_read(notification_id)
    return {"success": True}
