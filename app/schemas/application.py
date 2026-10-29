from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.tables import Applicant, Student
from pydantic import BaseModel, ConfigDict

class ApplicationCreate(BaseModel):
    company_name: str
    job_role: str
    job_description: str | None = None
    recipient_name: str | None = None
    recipient_email: str 
    

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    company_name: str
    job_role: str
    recipient_email: str
    status: str
    created_at: datetime

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