from __future__ import annotations

from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import ensure_user
from ..llm.ollama_client import call_ollama_chat, LLMError
from ..llm.embeddings_client import embed_text, EmbeddingError
from ..llm.prompts import SUMMARIZE_SYSTEM
from ..models import NoteEmbedding
from ..schemas import SummarizeRequest, SummarizeResponse, SummaryOptions, Citation, SummarizeMeta

router = APIRouter(prefix="/notes", tags=["ai"])


def _filter_citations(citations: List[dict], text: str) -> List[dict]:
    clean = []
    for c in citations or []:
        quote = (c.get("quote") or "").strip()
        why = (c.get("why") or "").strip()
        if quote and quote in text:
            clean.append({"quote": quote, "why": why or "Evidence"})
    return clean


@router.post("/summarize", response_model=SummarizeResponse)
def summarize_note(
    payload: SummarizeRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(ensure_user),
):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    opts: SummaryOptions = payload.options or SummaryOptions()

    user_msg = {
        "role": "user",
        "content": (
            f"NOTE:\n{payload.text}\n\n"
            f"Constraints:\n"
            f"- Language: {opts.language or 'en'}\n"
            f"- Max summary sentences: {opts.max_sentences or 5}\n"
            "Return JSON only."
        ),
    }
    messages = [
        {"role": "system", "content": SUMMARIZE_SYSTEM},
        user_msg,
    ]

    try:
        raw, meta = call_ollama_chat(messages, temperature=0.2)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Basic shape extraction
    summary = raw.get("summary") or []
    key_points = raw.get("key_points") or raw.get("bullets") or []
    citations_raw = raw.get("citations") or []
    citations_clean_dicts = _filter_citations(citations_raw, payload.text)

    citations = [Citation(**c) for c in citations_clean_dicts]

    # Embeddings: we embed the concatenated summary text
    try:
        emb = embed_text(" ".join(summary) or payload.text)
        if emb:
            # Note: note_id here is a string; only store if it is a valid UUID and matches a real note in your DB.
            # For now we just store by string key in NoteEmbedding (note_id uuid). If parse fails, we skip.
            try:
                from uuid import UUID as _UUID

                nid = _UUID(payload.note_id)
                existing = db.get(NoteEmbedding, nid)
                if existing:
                    existing.embedding = emb
                    db.add(existing)
                else:
                    db.add(NoteEmbedding(note_id=nid, embedding=emb))
                db.commit()
            except Exception:
                # note_id not a UUID or insert failed → ignore for now
                pass
    except EmbeddingError:
        # Don't block API if embeddings fail
        pass

    resp_meta = SummarizeMeta(
        model=meta["model"],
        temperature=meta["temperature"],
        tokens_in=meta["tokens_in"],
        tokens_out=meta["tokens_out"],
        latency_ms=meta["latency_ms"],
        status=meta["status"],
    )

    return SummarizeResponse(
        note_id=payload.note_id,
        summary=list(summary),
        key_points=list(key_points),
        citations=citations,
        meta=resp_meta,
    )
