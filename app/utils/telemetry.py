import time
from sqlalchemy.orm import Session
from collections import deque
from typing import Optional

# In-memory log (v0)
MEMORY_LOG = deque(maxlen=1000)

def log_v0(endpoint: str, method: str, latency_ms: int, status_code: int, user_id: Optional[str] = None):
    MEMORY_LOG.append({
        "endpoint": endpoint,
        "method": method,
        "latency_ms": latency_ms,
        "status_code": status_code,
        "user_id": user_id,
    })

def log_v1(db: Session, endpoint: str, method: str, latency_ms: int, status_code: int,
           user_id: Optional[str] = None, model: Optional[str] = None,
           tokens_in: Optional[int] = None, tokens_out: Optional[int] = None):
    db.execute("""
        INSERT INTO telemetry (user_id, endpoint, method, latency_ms, status_code, model, tokens_in, tokens_out)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (user_id, endpoint, method, latency_ms, status_code, model, tokens_in, tokens_out))
    db.commit()
