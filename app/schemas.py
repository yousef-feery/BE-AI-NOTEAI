from __future__ import annotations
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class NoteCreate(BaseModel):
    title: Optional[str] = None
    body: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    body: str

class NoteOut(BaseModel):
    id: UUID
    owner_id: UUID
    title: Optional[str] = None
    body: str
    status: str
    archived_at: Optional[datetime] = None
    trashed_at: Optional[datetime] = None
    is_pinned: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class NoteList(BaseModel):
    items: List[NoteOut]
    total: int
