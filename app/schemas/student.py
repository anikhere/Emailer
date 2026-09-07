from pydantic import BaseModel
from datetime import datetime
from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.tables import Student
from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException       


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
def create_Student(student:StudentCreate,db:Session = Depends(get_db)):
    query = select(student.email).where(Student.email==student.email)
    result = db.execute(query).scalar_one_or_None()
    if result is not None:
        raise HTTPException(
            status_code =  409,
            detail = 'A student with this email already exists'
        )
    new_student = Student(**student.model_dump())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student
    

    
    