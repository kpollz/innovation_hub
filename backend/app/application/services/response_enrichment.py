"""Response enrichment helpers.

Enriches basic domain entities with related data (author, counts, user state)
before returning to the client. Handles both single items and batch lists.
"""
from typing import Dict, List, Optional
from uuid import UUID

from app.domain.entities.problem import Problem
from app.domain.entities.idea import Idea
from app.domain.entities.room import Room
from app.domain.entities.comment import Comment
from app.domain.entities.reaction import ReactionType
from app.application.dto.problem_dto import ProblemResponseDTO, ProblemAuthorDTO, ProblemRoomSummaryDTO, SharedUserDTO as ProblemSharedUserDTO
from app.application.dto.idea_dto import IdeaResponseDTO, IdeaAuthorDTO, UserVoteDTO
from app.application.dto.room_dto import RoomResponseDTO, RoomCreatorDTO, SharedUserDTO as RoomSharedUserDTO
from app.application.dto.comment_dto import CommentResponseDTO, CommentAuthorDTO
from app.application.dto.event_dto import EventResponseDTO, EventCreatorDTO
from app.domain.entities.event import Event


def _make_author_dto(user) -> dict:
    """Build a lightweight author dict from a User entity."""
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
    }


async def enrich_problem(
    problem: Problem,
    user_repo,
    reaction_repo,
    comment_repo,
    current_user_id: Optional[UUID] = None,
    room_repo=None,
) -> ProblemResponseDTO:
    """Enrich a single problem with author, counts, and user reaction."""
    dto = ProblemResponseDTO.model_validate(problem)

    # Room linkback (Problem doesn't store room_id; look it up via Room.problem_id)
    if room_repo:
        linked_rooms = await room_repo.list_by_problem_id(problem.id)
        if linked_rooms:
            dto.room_id = linked_rooms[0].id  # backwards compat
            dto.rooms = [
                ProblemRoomSummaryDTO(id=r.id, name=r.name, status=r.status.value)
                for r in linked_rooms
            ]

    # Author
    author = await user_repo.get_by_id(problem.author_id)
    if author:
        dto.author = ProblemAuthorDTO(**_make_author_dto(author))

    # Shared users
    if problem.shared_user_ids:
        shared_users = await user_repo.get_by_ids(problem.shared_user_ids)
        dto.shared_users = [ProblemSharedUserDTO(**_make_author_dto(u)) for u in shared_users]

    # Reaction counts
    counts = await reaction_repo.get_counts_by_target(problem.id, "problem")
    dto.likes_count = counts.get(ReactionType.LIKE, 0)
    dto.dislikes_count = counts.get(ReactionType.DISLIKE, 0)
    dto.insights_count = counts.get(ReactionType.INSIGHT, 0)

    # Comment count
    _, comment_total = await comment_repo.list_by_target(problem.id, "problem", page=1, limit=1)
    dto.comments_count = comment_total

    # Current user's reaction
    if current_user_id:
        user_reaction = await reaction_repo.get_by_user_and_target(
            current_user_id, problem.id, "problem"
        )
        dto.user_reaction = user_reaction.type.value if user_reaction else None

    return dto


async def enrich_problems(
    problems: List[Problem],
    user_repo,
    reaction_repo,
    comment_repo,
    current_user_id: Optional[UUID] = None,
    room_repo=None,
) -> List[ProblemResponseDTO]:
    """Enrich a list of problems (batch)."""
    if not problems:
        return []

    # Collect unique author IDs
    author_ids = list({p.author_id for p in problems})
    authors: Dict[UUID, object] = {}
    for aid in author_ids:
        user = await user_repo.get_by_id(aid)
        if user:
            authors[aid] = user

    # Collect unique shared user IDs
    all_shared_ids = set()
    for p in problems:
        if p.shared_user_ids:
            all_shared_ids.update(p.shared_user_ids)
    shared_users_map: Dict[UUID, object] = {}
    if all_shared_ids:
        shared_user_list = await user_repo.get_by_ids(list(all_shared_ids))
        for u in shared_user_list:
            shared_users_map[u.id] = u

    results = []
    for problem in problems:
        dto = ProblemResponseDTO.model_validate(problem)

        # Room linkback
        if room_repo:
            linked_rooms = await room_repo.list_by_problem_id(problem.id)
            if linked_rooms:
                dto.room_id = linked_rooms[0].id  # backwards compat
                dto.rooms = [
                    ProblemRoomSummaryDTO(id=r.id, name=r.name, status=r.status.value)
                    for r in linked_rooms
                ]

        # Author
        author = authors.get(problem.author_id)
        if author:
            dto.author = ProblemAuthorDTO(**_make_author_dto(author))

        # Shared users
        if problem.shared_user_ids:
            dto.shared_users = [
                ProblemSharedUserDTO(**_make_author_dto(shared_users_map[uid]))
                for uid in problem.shared_user_ids if uid in shared_users_map
            ]

        # Reaction counts
        counts = await reaction_repo.get_counts_by_target(problem.id, "problem")
        dto.likes_count = counts.get(ReactionType.LIKE, 0)
        dto.dislikes_count = counts.get(ReactionType.DISLIKE, 0)
        dto.insights_count = counts.get(ReactionType.INSIGHT, 0)

        # Comment count
        _, comment_total = await comment_repo.list_by_target(problem.id, "problem", page=1, limit=1)
        dto.comments_count = comment_total

        # Current user's reaction
        if current_user_id:
            user_reaction = await reaction_repo.get_by_user_and_target(
                current_user_id, problem.id, "problem"
            )
            dto.user_reaction = user_reaction.type.value if user_reaction else None

        results.append(dto)

    return results


async def enrich_idea(
    idea: Idea,
    user_repo,
    reaction_repo,
    comment_repo,
    vote_repo,
    current_user_id: Optional[UUID] = None,
) -> IdeaResponseDTO:
    """Enrich a single idea with author, counts, votes, and user state."""
    dto = IdeaResponseDTO.model_validate(idea)

    # Author
    author = await user_repo.get_by_id(idea.author_id)
    if author:
        dto.author = IdeaAuthorDTO(**_make_author_dto(author))

    # Vote stats
    dto.vote_avg = await vote_repo.get_average_stars(idea.id)
    dto.vote_count = await vote_repo.get_vote_count(idea.id)

    # Comment count
    _, comment_total = await comment_repo.list_by_target(idea.id, "idea", page=1, limit=1)
    dto.comments_count = comment_total

    # Reaction counts
    counts = await reaction_repo.get_counts_by_target(idea.id, "idea")
    dto.likes_count = counts.get(ReactionType.LIKE, 0)
    dto.dislikes_count = counts.get(ReactionType.DISLIKE, 0)
    dto.insights_count = counts.get(ReactionType.INSIGHT, 0)

    # Current user's reaction
    if current_user_id:
        user_reaction = await reaction_repo.get_by_user_and_target(
            current_user_id, idea.id, "idea"
        )
        dto.user_reaction = user_reaction.type.value if user_reaction else None

        # Current user's vote
        user_vote = await vote_repo.get_by_user_and_idea(current_user_id, idea.id)
        dto.user_vote = UserVoteDTO(stars=user_vote.stars) if user_vote else None

    return dto


async def enrich_ideas(
    ideas: List[Idea],
    user_repo,
    reaction_repo,
    comment_repo,
    vote_repo,
    current_user_id: Optional[UUID] = None,
) -> List[IdeaResponseDTO]:
    """Enrich a list of ideas (batch)."""
    if not ideas:
        return []

    # Collect unique author IDs
    author_ids = list({i.author_id for i in ideas})
    authors: Dict[UUID, object] = {}
    for aid in author_ids:
        user = await user_repo.get_by_id(aid)
        if user:
            authors[aid] = user

    results = []
    for idea in ideas:
        dto = IdeaResponseDTO.model_validate(idea)

        # Author
        author = authors.get(idea.author_id)
        if author:
            dto.author = IdeaAuthorDTO(**_make_author_dto(author))

        # Vote stats
        dto.vote_avg = await vote_repo.get_average_stars(idea.id)
        dto.vote_count = await vote_repo.get_vote_count(idea.id)

        # Comment count
        _, comment_total = await comment_repo.list_by_target(idea.id, "idea", page=1, limit=1)
        dto.comments_count = comment_total

        # Reaction counts
        counts = await reaction_repo.get_counts_by_target(idea.id, "idea")
        dto.likes_count = counts.get(ReactionType.LIKE, 0)
        dto.dislikes_count = counts.get(ReactionType.DISLIKE, 0)
        dto.insights_count = counts.get(ReactionType.INSIGHT, 0)

        # Current user state
        if current_user_id:
            user_reaction = await reaction_repo.get_by_user_and_target(
                current_user_id, idea.id, "idea"
            )
            dto.user_reaction = user_reaction.type.value if user_reaction else None

            user_vote = await vote_repo.get_by_user_and_idea(current_user_id, idea.id)
            dto.user_vote = UserVoteDTO(stars=user_vote.stars) if user_vote else None

        results.append(dto)

    return results


async def enrich_room(
    room: Room,
    user_repo,
    idea_repo,
) -> RoomResponseDTO:
    """Enrich a single room with creator and idea count."""
    dto = RoomResponseDTO.model_validate(room)

    # Creator
    creator = await user_repo.get_by_id(room.created_by)
    if creator:
        dto.creator = RoomCreatorDTO(**_make_author_dto(creator))

    # Shared users
    if room.shared_user_ids:
        shared_users = await user_repo.get_by_ids(room.shared_user_ids)
        dto.shared_users = [RoomSharedUserDTO(**_make_author_dto(u)) for u in shared_users]

    # Idea count
    _, idea_total = await idea_repo.list({"room_id": room.id}, page=1, limit=1)
    dto.idea_count = idea_total

    return dto


async def enrich_rooms(
    rooms: List[Room],
    user_repo,
    idea_repo,
) -> List[RoomResponseDTO]:
    """Enrich a list of rooms (batch)."""
    if not rooms:
        return []

    # Collect unique creator IDs
    creator_ids = list({r.created_by for r in rooms})
    creators: Dict[UUID, object] = {}
    for cid in creator_ids:
        user = await user_repo.get_by_id(cid)
        if user:
            creators[cid] = user

    # Collect unique shared user IDs
    all_shared_ids = set()
    for r in rooms:
        if r.shared_user_ids:
            all_shared_ids.update(r.shared_user_ids)
    shared_users_map: Dict[UUID, object] = {}
    if all_shared_ids:
        shared_user_list = await user_repo.get_by_ids(list(all_shared_ids))
        for u in shared_user_list:
            shared_users_map[u.id] = u

    results = []
    for room in rooms:
        dto = RoomResponseDTO.model_validate(room)

        creator = creators.get(room.created_by)
        if creator:
            dto.creator = RoomCreatorDTO(**_make_author_dto(creator))

        # Shared users
        if room.shared_user_ids:
            dto.shared_users = [
                RoomSharedUserDTO(**_make_author_dto(shared_users_map[uid]))
                for uid in room.shared_user_ids if uid in shared_users_map
            ]

        _, idea_total = await idea_repo.list({"room_id": room.id}, page=1, limit=1)
        dto.idea_count = idea_total

        results.append(dto)

    return results


async def enrich_event(
    event: Event,
    user_repo,
    event_repo,
) -> EventResponseDTO:
    """Enrich a single event with creator and counts."""
    dto = EventResponseDTO.model_validate(event)

    creator = await user_repo.get_by_id(event.created_by)
    if creator:
        dto.creator = EventCreatorDTO(**_make_author_dto(creator))

    dto.team_count = await event_repo.get_team_count(event.id)
    dto.idea_count = await event_repo.get_idea_count(event.id)

    return dto


async def enrich_events(
    events: List[Event],
    user_repo,
    event_repo,
) -> List[EventResponseDTO]:
    """Enrich a list of events (batch)."""
    if not events:
        return []

    creator_ids = list({e.created_by for e in events})
    creators: Dict[UUID, object] = {}
    for cid in creator_ids:
        user = await user_repo.get_by_id(cid)
        if user:
            creators[cid] = user

    results = []
    for event in events:
        dto = EventResponseDTO.model_validate(event)

        creator = creators.get(event.created_by)
        if creator:
            dto.creator = EventCreatorDTO(**_make_author_dto(creator))

        dto.team_count = await event_repo.get_team_count(event.id)
        dto.idea_count = await event_repo.get_idea_count(event.id)

        results.append(dto)

    return results


async def enrich_comment(
    comment: Comment,
    user_repo,
) -> CommentResponseDTO:
    """Enrich a single comment with author info."""
    dto = CommentResponseDTO.model_validate(comment)

    author = await user_repo.get_by_id(comment.author_id)
    if author:
        dto.author = CommentAuthorDTO(**_make_author_dto(author))

    return dto


async def enrich_comments(
    comments: List[Comment],
    user_repo,
) -> List[CommentResponseDTO]:
    """Enrich a list of comments (batch)."""
    if not comments:
        return []

    author_ids = list({c.author_id for c in comments})
    authors: Dict[UUID, object] = {}
    for aid in author_ids:
        user = await user_repo.get_by_id(aid)
        if user:
            authors[aid] = user

    results = []
    for comment in comments:
        dto = CommentResponseDTO.model_validate(comment)

        author = authors.get(comment.author_id)
        if author:
            dto.author = CommentAuthorDTO(**_make_author_dto(author))

        results.append(dto)

    return results
