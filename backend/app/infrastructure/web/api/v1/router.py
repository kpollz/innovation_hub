"""API v1 router configuration."""
from fastapi import APIRouter

from app.infrastructure.web.api.v1.endpoints import auth, users, problems, rooms, ideas, comments

api_router = APIRouter(prefix="/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(problems.router, prefix="/problems", tags=["problems"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(ideas.router, prefix="/ideas", tags=["ideas"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
