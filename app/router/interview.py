from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.services.coach import AnswerCheck, check_answer
from fastapi.responses import Response

from scripts.gnani_tts import Hear
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api",
    tags=["interview"]
)


class AnswerType(BaseModel):
    question: str


class AnswerRequest(BaseModel):
    question: str
    answer: str
    student_id: str


@router.post(
    '/interview_answer/',
    response_model=AnswerCheck,
    status_code=200
)
def send_the_answer(request: AnswerRequest):
    answer = request.answer.strip()
    question = request.question.strip()

    if not answer:
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty."
        )

    try:
        op = check_answer(
            question=question,
            answer=answer,
            student_id=request.student_id
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="No resume on file for this profile. Please create it again."
        )

    if op is not None:
        return op

    raise HTTPException(
        status_code=503,
        detail="Answer evaluation is temporarily unavailable."
    )
@router.post('/hear_question/', response_model=AnswerType)
def play_question(request: AnswerType):
    try:
        audio = Hear(request.question)
        return Response(
            content=audio,
            media_type='audio/wav'
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
    except Exception as error:
        print(f"TTS error: {error}")

        raise HTTPException(
            status_code=502,
            detail="Could not generate question audio."
        )
