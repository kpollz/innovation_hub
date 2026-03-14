"""Problem category value object."""
from enum import Enum


class ProblemCategory(str, Enum):
    """Categories for problems."""
    PROCESS = "process"
    TECHNICAL = "technical"
    PEOPLE = "people"
    TOOLS = "tools"
    PATENT = "patent"
