from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from uuid import uuid4
from datetime import datetime, timezone
from ..db import get_db, Base, engine
from ..models import Note, NoteRevision
from ..schemas import NoteCreate, NoteUpdate, NoteOut, NoteList
from ..deps import ensure_user
from uuid import uuid4, UUID

router = APIRouter(prefix="/notes", tags=["notes"])
Base.metadata.create_all(engine)

def _own_or_404(db: Session, note_id: UUID, user_id: UUID) -> Note:
    n = db.get(Note, note_id)
    if not n or n.owner_id != user_id:
        raise HTTPException(status_code=404, detail="not found")
    return n


@router.post("", response_model=NoteOut, status_code=201)
def create_note(payload: NoteCreate, db: Session = Depends(get_db), user_id: UUID = Depends(ensure_user)):
    nid = uuid4()  # <-- DO NOT cast to str
    n = Note(id=nid, owner_id=user_id, title=payload.title, body=payload.body, status="active")
    db.add(n); db.flush()
    db.add(NoteRevision(note_id=nid, version=1, title=payload.title, body=payload.body, edited_by=user_id))
    db.commit(); db.refresh(n)
    return n

@router.get("", response_model=NoteList)
def list_notes(
    db: Session = Depends(get_db),
    user_id: str = Depends(ensure_user),
    status: str | None = Query(None, pattern="^(active|archived|trashed)$"),
    search: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    stmt = select(Note).where(Note.owner_id == user_id)
    if status:
        stmt = stmt.where(Note.status == status)
    if search:
        like = f"%{search}%"
        stmt = stmt.where((Note.title.ilike(like)) | (Note.body.ilike(like)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.execute(stmt.order_by(Note.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return {"items": rows, "total": total}

@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(ensure_user)):
    return _own_or_404(db, note_id, user_id)


@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: UUID, payload: NoteUpdate, db: Session = Depends(get_db), user_id: UUID = Depends(ensure_user)):
    n = _own_or_404(db, note_id, user_id)
    n.title = payload.title
    n.body = payload.body
    db.add(n)
    last_ver = db.scalar(select(func.max(NoteRevision.version)).where(NoteRevision.note_id == note_id)) or 0
    db.add(NoteRevision(note_id=note_id, version=last_ver + 1, title=payload.title, body=payload.body, edited_by=user_id))
    db.commit(); db.refresh(n)
    return n

@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(ensure_user)):
    n = _own_or_404(db, note_id, user_id)
    db.delete(n); db.commit()
    return

@router.post("/{note_id}/archive", response_model=NoteOut)
def archive_note(note_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(ensure_user)):
    n = _own_or_404(db, note_id, user_id)
    n.status = "archived"
    n.archived_at = datetime.now(timezone.utc)
    n.trashed_at = None
    db.add(n); db.commit(); db.refresh(n)
    return n

@router.post("/{note_id}/trash", response_model=NoteOut)
def trash_note(note_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(ensure_user)):
    n = _own_or_404(db, note_id, user_id)
    n.status = "trashed"
    n.trashed_at = datetime.now(timezone.utc)
    db.add(n); db.commit(); db.refresh(n)
    return n

@router.post("/{note_id}/restore", response_model=NoteOut)
def restore_note(note_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(ensure_user)):
    n = _own_or_404(db, note_id, user_id)
    n.status = "active"
    n.archived_at = None
    n.trashed_at = None
    db.add(n); db.commit(); db.refresh(n)
    return n
