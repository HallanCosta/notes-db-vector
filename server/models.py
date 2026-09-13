"""
Pydantic models for request/response validation.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Schema for chat message."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Schema for chat request."""
    message: str = Field(..., min_length=1, description="User message")
    session_id: str = Field(default="default", description="Session ID for conversation")


class ChatResponse(BaseModel):
    """Schema for chat response."""
    user_message: ChatMessage
    assistant_message: ChatMessage


class NoteCreate(BaseModel):
    """Payload used to create a note."""

    title: str = Field(..., min_length=1, description="Título da nota")
    content: str = Field(..., min_length=1, description="Conteúdo da nota")


class Note(BaseModel):
    """Note returned by the notes API."""

    id: UUID
    title: str
    content: str
    created_at: datetime
    similarity: Optional[float] = None
