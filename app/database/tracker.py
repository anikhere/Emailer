from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.tables import Tracker
from pydantic import BaseModel
from typing import Literal

class Tracker_Create(BaseModel):
    phase: Literal['visited', 'student_submitted', 'applicant_submitted', 'draft_success', 'gmail_opened']
    user_id: str

router = APIRouter(prefix='/api', tags=['tracker'],include_in_schema=True)

@router.post('/tracker', status_code=201)
def Create_track(data: Tracker_Create, db: Session = Depends(get_db)):
    row = Tracker(phase=data.phase, user_id=data.user_id)
    db.add(row)
    db.commit()
    return {"ok": True}