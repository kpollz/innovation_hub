"""Event FAQ DTOs."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateFAQRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    answer: Optional[str] = Field(None, max_length=5000)
    sort_order: Optional[int] = None


class UpdateFAQRequest(BaseModel):
    question: Optional[str] = Field(None, min_length=1, max_length=2000)
    answer: Optional[str] = Field(None, max_length=5000)
    sort_order: Optional[int] = None


class FAQResponse(BaseModel):
    id: UUID
    event_id: UUID
    question: str
    answer: Optional[str] = None
    sort_order: int = 0
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
