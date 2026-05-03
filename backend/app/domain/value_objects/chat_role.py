"""Chat role value object."""
from enum import Enum


class ChatRole(str, Enum):
    """Role of the message sender."""
    USER = "user"
    ASSISTANT = "assistant"
