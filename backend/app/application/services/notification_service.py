"""Notification service - creates notifications as side effects of user actions."""
import logging
from typing import List
from uuid import UUID

from app.domain.entities.notification import Notification
from app.domain.repositories.notification_repository import NotificationRepository
from app.domain.repositories.comment_repository import CommentRepository
from app.domain.repositories.reaction_repository import ReactionRepository
from app.domain.repositories.vote_repository import VoteRepository

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating notifications when actions happen."""

    def __init__(
        self,
        notification_repo: NotificationRepository,
        comment_repo: CommentRepository,
        reaction_repo: ReactionRepository,
        vote_repo: VoteRepository,
    ):
        self.notification_repo = notification_repo
        self.comment_repo = comment_repo
        self.reaction_repo = reaction_repo
        self.vote_repo = vote_repo

    async def _collect_interactors(
        self, target_id: UUID, target_type: str
    ) -> set[UUID]:
        """Collect all user IDs who interacted with a target."""
        user_ids: set[UUID] = set()

        # Users who commented
        comment_authors = await self.comment_repo.list_distinct_authors_by_target(
            target_id, target_type
        )
        user_ids.update(comment_authors)

        # Users who reacted
        reaction_users = await self.reaction_repo.list_distinct_users_by_target(
            target_id, target_type
        )
        user_ids.update(reaction_users)

        # Users who voted (only for ideas)
        if target_type == "idea":
            vote_users = await self.vote_repo.list_distinct_users_by_idea(target_id)
            user_ids.update(vote_users)

        return user_ids

    async def notify(
        self,
        actor_id: UUID,
        target_id: UUID,
        target_type: str,
        target_title: str,
        notification_type: str,
        owner_id: UUID,
    ) -> None:
        """Create notifications for the owner and all interactors of a target.

        Args:
            actor_id: The user who performed the action.
            target_id: The problem or idea ID.
            target_type: 'problem' or 'idea'.
            target_title: Title for display.
            notification_type: comment_added, reaction_added, vote_added, status_changed.
            owner_id: The author_id of the target problem/idea.
        """
        try:
            recipients: set[UUID] = set()

            # Always include the owner
            recipients.add(owner_id)

            # Add all interactors
            interactors = await self._collect_interactors(target_id, target_type)
            recipients.update(interactors)

            # Never notify the actor themselves
            recipients.discard(actor_id)

            if not recipients:
                return

            notifications = [
                Notification(
                    user_id=user_id,
                    actor_id=actor_id,
                    type=notification_type,
                    target_id=target_id,
                    target_type=target_type,
                    target_title=target_title,
                )
                for user_id in recipients
            ]

            await self.notification_repo.create_bulk(notifications)
            logger.info(
                "Created %d notifications (type=%s, target=%s/%s)",
                len(notifications),
                notification_type,
                target_type,
                target_id,
            )
        except Exception:
            logger.exception("Failed to create notifications")
