from pydantic import BaseModel
from datetime import datetime
from fastapi import APIRouter
from fastapi import Depends
from app.services.rag import process_resume, save_student_resume    
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.tables import Student
from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException       

class student_profile(BaseModel):
    name:str
    email:str
    resume_text: str

class StudentCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    resume_text: str


class StudentResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

router = APIRouter(
    prefix="/api/students",
    tags=["Students"],
)
@router.post(
    '',
    response_model=StudentResponse,
    status_code=201
)
def create_Student(student: StudentCreate, db: Session = Depends(get_db)):
    query = select(Student).where(Student.email == student.email)
    result = db.execute(query).scalar_one_or_none()
    if result is not None:
        raise HTTPException(
            status_code=409,
            detail='A student with this email already exists'
        )

    try:
        chunks, vectors = process_resume(student.resume_text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(e)}"
        )

    new_student = Student(**student.model_dump())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    save_student_resume(new_student.id, chunks, vectors)

    return new_student


@router.get('/{student_id}',response_model=student_profile)
def get_students_cred(student_id:int,db:Session = Depends(get_db)):
    stud = db.get(Student,student_id)
    if stud is None:
        raise HTTPException(
            status_code=404,
            detail='the student doesnt exists'
        )
    return stud 

    
    