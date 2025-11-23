from __future__ import annotations

import os
from typing import List

import httpx

NOMIC_EMBED_URL = os.environ.get("NOMIC_EMBED_URL", "http://localhost:8000/api/embeddings")


class EmbeddingError(RuntimeError):
    pass


def embed_text(text: str) -> List[float]:
    """
    Calls your Nomic-AI embedding service.

    Expected generic API:
    POST NOMIC_EMBED_URL
    { "text": "<string>" } -> { "embedding": [float, ...] }

    Adjust this to match your actual Nomic repo if needed.
    """
    if not text.strip():
        return []

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(NOMIC_EMBED_URL, json={"text": text})
    if resp.status_code != 200:
        raise EmbeddingError(f"Embedding service error {resp.status_code}: {resp.text}")
    data = resp.json()
    emb = data.get("embedding")
    if not isinstance(emb, list):
        raise EmbeddingError("Invalid embedding format from service")
    return [float(x) for x in emb]
