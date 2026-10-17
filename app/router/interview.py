import random 
from fastapi import APIRouter, HTTPException  
from pydantic import BaseModel
from app.services.coach import AnswerCheck,check_answer
file_path = 'saved_file.npz'
ques = [
"Tell me about a project you built using Python and Google Gemini.",
"How did you use FastAPI and SQLAlchemy during your internship?",
"How did you work with PostgreSQL databases in your backend development experience?"]


class AnswerType(BaseModel):
    question: str
class AnswerRequest(BaseModel):
    question: str
    answer: str


router = APIRouter(
    prefix="/api",
    tags=["interview"]
)


@router.get(
    "/interview/",
    response_model=AnswerType,
    status_code=200
)
def send_question_to_frontend():
    
    question = random.choice(ques)
    return {'question':question}
    
@router.post(
    '/interview_answer/',
    response_model=AnswerCheck,
    status_code=200
)
def send_the_answer(request:AnswerRequest):
    answer = request.answer.strip()
    question = request.question.strip()

    if not answer:
        raise HTTPException(
           status_code=400,
           detail="Answer cannot be empty."
    )
    op = check_answer(question=question,answer=answer,file_path=file_path)
    if op is not None:
        return op 
    raise HTTPException(
        status_code=503,
        detail="Answer evaluation is temporarily unavailable."
    )
