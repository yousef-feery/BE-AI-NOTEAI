from fastapi import Header, Cookie, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from .db import get_db
from .models import User

def get_current_user_id(
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    uid_cookie: str | None = Cookie(None, alias="uid"),
) -> UUID:
    raw = x_user_id or uid_cookie
    if not raw:
        # No header and no cookie → 401 (FE should call /auth/dev-login first)
        raise HTTPException(status_code=401, detail="Missing user identity. Call /auth/dev-login.")
    try:
        return UUID(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

def ensure_user(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)) -> UUID:
    if not db.get(User, user_id):
        db.add(User(id=user_id, email=None, display_name=None))
        db.commit()
    return user_id
