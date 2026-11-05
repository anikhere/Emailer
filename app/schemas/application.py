from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.tables import Applicant, Student
from pydantic import BaseModel, ConfigDict
from typing import Literal

class StatusUpdate(BaseModel):
    status: Literal["Drafted", "Sent", "Replied", "Closed"]
    student_id: int


class ApplicationCreate(BaseModel):
    company_name: str
    job_role: str
    recipient_email: str
    job_description: str = ""
    recipient_name: str = "Hiring Team"    
    instructions :str = ''

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    company_name: str | None = None
    job_role: str
    recipient_email: str
    status: str
    created_at: datetime
    updated_at: datetime

router = APIRouter(
    prefix='/api',
    tags=['Application']
)
@router.post(
    '/students/{student_id}/applications',
    response_model=ApplicationResponse,
    status_code=201,
)
def create_application(
    student_id:int,
    application:ApplicationCreate,
    db:Session = Depends(get_db)
):
    student_rec = db.get(Student,student_id)
    if student_rec is None:
        raise HTTPException(
            status_code=404,
            detail='Student not found'
        )
    new_applicant = Applicant(
        student_id = student_id,
        **application.model_dump()
    )
    db.add(new_applicant)
    db.commit()
    db.refresh(new_applicant)
    return new_applicant
@router.get('/{applicant_id}/resume')
def Fetch_resume(
    applicant_id:int,
    db:Session = Depends(get_db)):
    applicant = db.get(Applicant,applicant_id)
    if applicant is None:
        raise HTTPException(
            status_code=404,
            detail='Application not Found'
        )
    return {
        'application':applicant.id,
        'student_id':applicant.student_id,
        'resume':applicant.student.resume_text
    }
@router.get(
    '/students/{student_id}/applications',
    response_model=list[ApplicationResponse],
)
def list_app(student_id: int, db: Session = Depends(get_db)):
    stud_rec = db.get(Student, student_id)
    if stud_rec is None:
        raise HTTPException(status_code=404, detail='student not found')

    rows = (
        db.query(Applicant)
        .filter(Applicant.student_id == student_id)
        .order_by(Applicant.created_at.desc())
        .all()
    )

    return [
        ApplicationResponse(
            id=row.id,
            student_id=row.student_id,
            company_name=row.company_name or '',
            job_role=row.job_role,
            recipient_email=row.recipient_email,
            status='Drafted' if row.status == 'Pending' else row.status,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]
@router.patch(
    '/applications/{application_id}/status',
    response_model=ApplicationResponse,
)
def update_status(
    application_id:int,
    payload:StatusUpdate,
    db:Session = Depends(get_db)
):
    row = db.get(Applicant,application_id)
    if row is None:
        raise HTTPException(status_code=404,detail='application not Found')
    if row.student_id != payload.student_id:
        raise HTTPException(status_code=403, detail='Not your application')
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return row 
