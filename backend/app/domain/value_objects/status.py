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
    draft ↔ refining ↔ reviewing → submitted / closed
    (Board view allows free drag-drop between draft/refining/reviewing)
    """
    DRAFT = "draft"
    REFINING = "refining"
    REVIEWING = "reviewing"
    SUBMITTED = "submitted"
    CLOSED = "closed"

    @classmethod
    def valid_transitions(cls) -> Dict["IdeaStatus", List["IdeaStatus"]]:
        """Define valid status transitions.
        draft/refining/reviewing can freely move between each other.
        submitted and closed are terminal.
        """
        return {
            cls.DRAFT: [cls.REFINING, cls.REVIEWING, cls.SUBMITTED, cls.CLOSED],
            cls.REFINING: [cls.DRAFT, cls.REVIEWING, cls.SUBMITTED, cls.CLOSED],
            cls.REVIEWING: [cls.DRAFT, cls.REFINING, cls.SUBMITTED, cls.CLOSED],
            cls.SUBMITTED: [],
            cls.CLOSED: []
        }


class RoomStatus(str, Enum):
    """Status for brainstorming rooms."""
    ACTIVE = "active"
    ARCHIVED = "archived"
