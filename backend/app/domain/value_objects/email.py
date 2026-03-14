"""Email value object."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Email:
    """Immutable email value object."""
    value: str
    
    def __post_init__(self):
        if "@" not in self.value:
            raise ValueError(f"Invalid email format: {self.value}")
    
    def __str__(self) -> str:
        return self.value
