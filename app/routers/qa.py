from fastapi import APIRouter, HTTPException
from app.schemas import QAIn, QAOut, Citation

router = APIRouter(prefix="/notes", tags=["qa"])

@router.post("/qa", response_model=QAOut)
def answerQuestion(payload: QAIn):
    # 1) Validate input
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    if not payload.note_id or not payload.note_id.strip():
        raise HTTPException(status_code=400, detail="note_id is required")
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    citations = []  # integrate later
    answer = "Not enough info."

    # 5) Return structured JSON
    return QAOut(
        note_id=payload.note_id,
        question=payload.question,
        answer=answer,
        citations=[Citation(**c) for c in citations],
        meta={"status": "not_implemented"}
    )
