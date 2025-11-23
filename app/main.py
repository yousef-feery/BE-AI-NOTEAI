from __future__ import annotations

import time
from fastapi import FastAPI, Request
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID as PGUUID, ENUM as PGEnum, JSONB
from .db import Base, engine, get_db
from .routers import notes, favorites, summarize, qa, auth

# Create tables on startup (dev only; for prod use migrations)
Base.metadata.create_all(engine)

app = FastAPI(title="NoteAI Backend")

# Routers
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(favorites.router)
app.include_router(summarize.router)
app.include_router(qa.router)


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/healthz/db")
def healthz_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"db": "up"}
    except Exception as e:
        return {"db": "down", "error": str(e)}


from collections import deque

TELEMETRY_LOG = deque(maxlen=1000)


@app.middleware("http")
async def telemetry_middleware(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        status = response.status_code
    except Exception:
        status = 500
        raise
    finally:
        latency_ms = int((time.time() - start) * 1000)
        user_id = request.headers.get("X-User-Id") or request.cookies.get("uid")
        TELEMETRY_LOG.append(
            {
                "path": request.url.path,
                "method": request.method,
                "status": status,
                "latency_ms": latency_ms,
                "user_id": user_id,
            }
        )
    return response


@app.get("/telemetry/v0")
def telemetry_v0_snapshot():
    return list(TELEMETRY_LOG)
