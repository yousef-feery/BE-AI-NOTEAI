from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

class Citation(BaseModel):
    quote: str
    why: str

class SummarizeIn(BaseModel):
    note_id: str
    text: str
    options: dict | None = None

class SummarizeOut(BaseModel):
    note_id: str
    summary: List[str]
    key_points: List[str]
    citations: List[Citation]
    meta: dict

router = APIRouter(prefix="/notes", tags=["ai"])

@router.post("/summarize", response_model=SummarizeOut)
def summarize_stub(payload: SummarizeIn):
    raise HTTPException(status_code=501, detail="Summarization not implemented yet")
