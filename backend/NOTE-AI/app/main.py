from __future__ import annotations

import time
from collections import deque
import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .db import Base, engine, get_db
from .routers import notes, favorites, summarize, qa, auth

# Create tables on startup (dev only; for prod use migrations)
Base.metadata.create_all(engine)

app = FastAPI(title="NoteAI Backend")

# CORS – allow frontend on :5500
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(favorites.router)
app.include_router(summarize.router)
app.include_router(qa.router)

# ---------- DEV LOGIN ENDPOINT ----------
@app.post("/auth/dev-login")
def dev_login(response: Response):
    """
    Simple dev login:
    - generates a random user_id
    - sets it in 'uid' cookie
    - returns it as JSON
    """
    user_id = str(uuid.uuid4())

    response.set_cookie(
        "uid",
        user_id,
        httponly=True,
        samesite="lax",
    )

    return {"user_id": user_id}
# ----------------------------------------


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
