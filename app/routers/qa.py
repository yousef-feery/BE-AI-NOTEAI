from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

class Citation(BaseModel):
    quote: str
    why: str

class QAIn(BaseModel):
    note_id: str
    question: str
    text: str
    options: dict | None = None

class QAOut(BaseModel):
    note_id: str
    question: str
    answer: str
    citations: List[Citation]
    meta: dict

router = APIRouter(prefix="/notes", tags=["ai"])

@router.post("/qa", response_model=QAOut)
def qa_stub(payload: QAIn):
    raise HTTPException(status_code=501, detail="Q&A not implemented yet")
