"""User role value object."""
from enum import Enum


class UserRole(str, Enum):
    """User roles in the system."""
    MEMBER = "member"
    ADMIN = "admin"
