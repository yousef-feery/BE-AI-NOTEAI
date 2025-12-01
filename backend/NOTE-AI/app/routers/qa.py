from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import ensure_user
from ..llm.ollama_client import call_ollama_chat, LLMError
from ..llm.prompts import QA_SYSTEM
from ..schemas import QARequest, QAResponse, QAOptions, Citation, QAMeta

router = APIRouter(prefix="/notes", tags=["ai"])


def _filter_citations(text: str, citations_raw) -> list[dict]:
    clean = []
    for c in citations_raw or []:
        quote = (c.get("quote") or "").strip()
        why = (c.get("why") or "").strip()
        if quote and quote in text:
            clean.append({"quote": quote, "why": why or "Evidence"})
    return clean


@router.post("/qa", response_model=QAResponse)
def answer_question(
    payload: QARequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(ensure_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    opts: QAOptions = payload.options or QAOptions()

    user_msg = {
        "role": "user",
        "content": (
            f'Question: "{payload.question}"\n\n'
            f"Note:\n{payload.text}\n\n"
            "Remember: answer only from the note. Output JSON only."
        ),
    }

    messages = [
        {"role": "system", "content": QA_SYSTEM},
        user_msg,
    ]

    try:
        raw, meta = call_ollama_chat(messages, temperature=0.2)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # "Not enough info" shortcut (in case model followed the special template)
    if raw.get("answer") == "Not enough info.":
        return QAResponse(
            note_id=payload.note_id,
            question=payload.question,
            answer="Not enough info.",
            citations=[],
            meta=QAMeta(
                model=meta["model"],
                temperature=meta["temperature"],
                tokens_in=meta["tokens_in"],
                tokens_out=meta["tokens_out"],
                latency_ms=meta["latency_ms"],
                status="not_enough_info",
                retrieved=1,
            ),
        )

    answer = raw.get("answer") or ""
    if not answer:
        answer = "Not enough info."

    citations_raw = raw.get("citations") or []
    citations_clean = [Citation(**c) for c in _filter_citations(payload.text, citations_raw)]

    status = "grounded" if answer != "Not enough info." else "not_enough_info"

    meta_obj = QAMeta(
        model=meta["model"],
        temperature=meta["temperature"],
        tokens_in=meta["tokens_in"],
        tokens_out=meta["tokens_out"],
        latency_ms=meta["latency_ms"],
        status=status,
        retrieved=1,  # we only have one note as context for now
    )

    return QAResponse(
        note_id=payload.note_id,
        question=payload.question,
        answer=answer,
        citations=citations_clean,
        meta=meta_obj,
    )
