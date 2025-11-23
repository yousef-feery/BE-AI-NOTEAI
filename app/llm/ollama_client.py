import httpx
import time
import os
import json
from typing import Any, Dict, Tuple

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3:8b")


class LLMError(RuntimeError):
    pass


def _extract_json(text: str) -> Dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise LLMError("No JSON object found in LLM output")
    raw = text[start : end + 1]
    return json.loads(raw)


def call_ollama_chat(
    messages: list[dict[str, str]],
    temperature: float = 0.2,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": messages,
        "options": {
            "temperature": temperature,
        },
    }

    timeout = httpx.Timeout(
        connect=10.0,
        read=600.0,   # <<< increase read timeout here
        write=60.0,
        pool=None,
    )

    t0 = time.monotonic()
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload)
    except httpx.RequestError as e:
        raise LLMError(f"Error contacting Ollama at {url}: {e}") from e

    latency_ms = int((time.monotonic() - t0) * 1000)

    if resp.status_code != 200:
        raise LLMError(f"Ollama error {resp.status_code}: {resp.text}")

    data = resp.json()
    content = data.get("message", {}).get("content", "")
    parsed = _extract_json(content)

    meta = {
        "model": OLLAMA_MODEL,
        "temperature": temperature,
        "tokens_in": 0,
        "tokens_out": 0,
        "latency_ms": latency_ms,
        "status": parsed.get("meta", {}).get("status", "grounded"),
    }
    return parsed, meta
