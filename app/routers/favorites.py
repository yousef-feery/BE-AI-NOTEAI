from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..db import get_db
from ..models import Favorite, Note
from ..schemas import NoteList
from ..deps import ensure_user

router = APIRouter(prefix="/notes", tags=["favorites"])

def _own_or_404(db: Session, note_id: str, user_id: str) -> Note:
    n = db.get(Note, note_id)
    if not n or n.owner_id != user_id:
        raise HTTPException(status_code=404, detail="not found")
    return n

@router.post("/{note_id}/favorite", status_code=204)
def add_favorite(note_id: str, db: Session = Depends(get_db), user_id: str = Depends(ensure_user)):
    _own_or_404(db, note_id, user_id)
    if not db.get(Favorite, {"user_id": user_id, "note_id": note_id}):
        db.add(Favorite(user_id=user_id, note_id=note_id))
        db.commit()
    return

@router.delete("/{note_id}/favorite", status_code=204)
def remove_favorite(note_id: str, db: Session = Depends(get_db), user_id: str = Depends(ensure_user)):
    fav = db.get(Favorite, {"user_id": user_id, "note_id": note_id})
    if fav:
        db.delete(fav); db.commit()
    return

@router.get("/me/favorites", response_model=NoteList)
def list_my_favorites(db: Session = Depends(get_db), user_id: str = Depends(ensure_user)):
    stmt = select(Note).join(Favorite, Favorite.note_id == Note.id).where(
        Favorite.user_id == user_id, Note.status != "trashed"
    ).order_by(Note.created_at.desc())
    rows = db.execute(stmt).scalars().all()
    return {"items": rows, "total": len(rows)}
