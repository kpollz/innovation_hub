"""API v1 router configuration."""
from fastapi import APIRouter

from app.infrastructure.web.api.v1.endpoints import (
    auth,
    users,
    problems,
    rooms,
    ideas,
    comments,
    dashboard,
    uploads,
    notifications,
    events,
    event_teams,
    event_ideas,
    event_scoring,
)
from app.infrastructure.web.api.v1.endpoints.reactions import (
    problem_reactions_router,
    idea_reactions_router,
)

api_router = APIRouter(prefix="/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(problems.router, prefix="/problems", tags=["problems"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(ideas.router, prefix="/ideas", tags=["ideas"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(events.router, prefix="/events", tags=["events"])

# Event team sub-routes (nested under events)
api_router.include_router(event_teams.router, prefix="/events/{event_id}/teams", tags=["event-teams"])

# Event idea sub-routes (nested under events)
api_router.include_router(event_ideas.router, prefix="/events/{event_id}/ideas", tags=["event-ideas"])

# Event scoring sub-routes (nested under events)
api_router.include_router(event_scoring.router, prefix="/events/{event_id}", tags=["event-scoring"])

# Reaction sub-routes (nested under problems and ideas)
api_router.include_router(problem_reactions_router, prefix="/problems", tags=["reactions"])
api_router.include_router(idea_reactions_router, prefix="/ideas", tags=["reactions"])
