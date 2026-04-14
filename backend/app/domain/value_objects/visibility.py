"""Visibility value object for Problem and Room privacy."""
from enum import Enum


class Visibility(str, Enum):
    """Visibility levels for problems and rooms."""
    PUBLIC = "public"
    PRIVATE = "private"