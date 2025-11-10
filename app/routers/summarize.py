from fastapi import APIRouter, HTTPException
from app.schemas import SummarizeIn, SummarizeOut, Citation

router = APIRouter(prefix="/notes", tags=["summarize"])

@router.post("/summarize", response_model=SummarizeOut)
def summarizeNote(payload: SummarizeIn):
    # 1) Validate input
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    if not payload.note_id or not payload.note_id.strip():
        raise HTTPException(status_code=400, detail="note_id is required")

    citations = []  # integrate later
    summary = []    # integrate later
    key_points = [] # integrate later

    # 5) Return structured JSON
    return SummarizeOut(
        note_id=payload.note_id,
        summary=summary,
        key_points=key_points,
        citations=[Citation(**c) for c in citations],
        meta={"status": "not_implemented"}
    )
