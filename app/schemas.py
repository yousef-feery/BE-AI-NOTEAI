from pydantic import BaseModel
from typing import List, Optional

class Citation(BaseModel):
    quote: str
    why: str

class SummarizeIn(BaseModel):
    note_id: str
    text: str
    options: Optional[dict] = None

class SummarizeOut(BaseModel):
    note_id: str
    summary: List[str]
    key_points: List[str]
    citations: List[Citation]
    meta: dict

class QAIn(BaseModel):
    note_id: str
    question: str
    text: str
    options: Optional[dict] = None

class QAOut(BaseModel):
    note_id: str
    question: str
    answer: str
    citations: List[Citation]
    meta: dict
