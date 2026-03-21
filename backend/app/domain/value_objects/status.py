"""Status value objects."""
from enum import Enum
from typing import Dict, List


class ProblemStatus(str, Enum):
    """Status workflow for problems:
    open → discussing → brainstorming → solved → closed
    """
    OPEN = "open"
    DISCUSSING = "discussing"
    BRAINSTORMING = "brainstorming"
    SOLVED = "solved"
    CLOSED = "closed"

    @classmethod
    def valid_transitions(cls) -> Dict["ProblemStatus", List["ProblemStatus"]]:
        """Define valid status transitions."""
        return {
            cls.OPEN: [cls.DISCUSSING, cls.BRAINSTORMING, cls.CLOSED],
            cls.DISCUSSING: [cls.BRAINSTORMING, cls.SOLVED, cls.CLOSED],
            cls.BRAINSTORMING: [cls.SOLVED, cls.CLOSED],
            cls.SOLVED: [],   # terminal status (parallel with closed)
            cls.CLOSED: []    # terminal status (parallel with solved)
        }


class IdeaStatus(str, Enum):
    """Status workflow for ideas:
    draft → refining → ready → selected
       ↓                   ↓
    rejected            (or rejected)
    """
    DRAFT = "draft"
    REFINING = "refining"
    READY = "ready"
    SELECTED = "selected"
    REJECTED = "rejected"

    @classmethod
    def valid_transitions(cls) -> Dict["IdeaStatus", List["IdeaStatus"]]:
        """Define valid status transitions."""
        return {
            cls.DRAFT: [cls.REFINING, cls.REJECTED],
            cls.REFINING: [cls.READY, cls.REJECTED],
            cls.READY: [cls.SELECTED, cls.REJECTED],
            cls.SELECTED: [],
            cls.REJECTED: []
        }


class RoomStatus(str, Enum):
    """Status for brainstorming rooms."""
    ACTIVE = "active"
    ARCHIVED = "archived"
