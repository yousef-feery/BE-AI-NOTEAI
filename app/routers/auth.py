from uuid import uuid4
from fastapi import APIRouter, Response, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User

router = APIRouter(tags=["auth"])

@router.post("/auth/dev-login")
def dev_login(response: Response, db: Session = Depends(get_db)):
    """
    Issues a fresh anonymous user id for local/dev use.
    - Creates a User row
    - Returns { user_id }
    - Sets cookie `uid` (HttpOnly) so FE doesn’t have to pass a header manually
    """
    uid = uuid4()
    db.add(User(id=uid, email=None, display_name=None))
    db.commit()

    response.set_cookie(
        key="uid",
        value=str(uid),
        httponly=True,
        samesite="Lax",
        max_age=60 * 60 * 24 * 365,  # 1 year
    )
    return {"user_id": str(uid)}
