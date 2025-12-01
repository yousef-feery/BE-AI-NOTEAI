from __future__ import annotations
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

# -------- Notes CRUD (what you already have) -------------------

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

    model_config = {"from_attributes": True}

class NoteList(BaseModel):
    items: List[NoteOut]
    total: int


# -------- Summarization / QA schemas ----------------------------

class SummaryOptions(BaseModel):
    language: Optional[str] = "en"
    max_sentences: Optional[int] = 5

class Citation(BaseModel):
    quote: str
    why: str

class SummarizeRequest(BaseModel):
    note_id: str
    text: str
    options: Optional[SummaryOptions] = None

class SummarizeMeta(BaseModel):
    model: str
    temperature: float
    tokens_in: int
    tokens_out: int
    latency_ms: int
    status: str

class SummarizeResponse(BaseModel):
    note_id: str
    summary: List[str]
    key_points: List[str]
    citations: List[Citation]
    meta: SummarizeMeta


class QAOptions(BaseModel):
    answer_mode: Optional[str] = "grounded"

class QARequest(BaseModel):
    note_id: str
    question: str
    text: str
    options: Optional[QAOptions] = None

class QAMeta(BaseModel):
    model: str
    temperature: float
    tokens_in: int
    tokens_out: int
    latency_ms: int
    status: str
    retrieved: int

class QAResponse(BaseModel):
    note_id: str
    question: str
    answer: str
    citations: List[Citation]
    meta: QAMeta
