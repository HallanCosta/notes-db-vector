"""
Pydantic models for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    """Schema for creating a new note."""
    title: str = Field(..., min_length=1, max_length=500, description="Note title")
    content: str = Field(..., min_length=1, description="Note content")


class NoteUpdate(BaseModel):
    """Schema for updating an existing note."""
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Note title")
    content: Optional[str] = Field(None, min_length=1, description="Note content")


class NoteResponse(BaseModel):
    """Schema for note response (without embedding)."""
    id: UUID
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    """Schema for list of notes response with pagination."""
    notes: List[NoteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
