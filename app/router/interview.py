import random 
from fastapi import APIRouter, HTTPException,UploadFile,File
from pydantic import BaseModel
from app.services.coach import AnswerCheck,check_answer
from app.services.rag import retrieve                          
import numpy as np
import subprocess
import os
from fastapi.responses import Response


from scripts.gnani_tts import Hear
import tempfile
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from pathlib import Path
from gnani.stt import (
    GnaniSTTClient,
    AuthenticationError,
    InvalidAudioError,
    APIError,
)
FFMPEG_PATH = (
    r"C:\Users\Lenovo\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg.Shared_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-9.0.2-full_build-shared\bin\ffmpeg.exe"
)
data = np.load('saved_file.npz',allow_pickle=False)
chunks = data['chunks'].tolist()
vectors = data['vector']



load_dotenv()

file_path = 'saved_file.npz'
ques = [
"Tell me about a project you built using Python and Google Gemini.",
"How did you use FastAPI and SQLAlchemy during your internship?",
"How did you work with PostgreSQL databases in your backend development experience?"]

class WAV_FIle(BaseModel):
    transcript:str
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
@router.post(
    '/stt',
    response_model=WAV_FIle,
    status_code=200  # CHANGED: 200 because we return a transcription
)
async def Wav_upload(file: UploadFile = File(...)):
    temp_path = None

    try:  # CHANGED: Moved try above file reading and client creation

        audio_bites = await file.read()  # CHANGED: Now inside try

        with tempfile.NamedTemporaryFile(
            suffix='.webm',
            delete=False
        ) as temp:
            temp.write(audio_bites)
            inp_path = temp.name

        temp_path = inp_path.rsplit(".", 1)[0] + ".wav"
        await run_in_threadpool(
            subprocess.run,
                [
                    FFMPEG_PATH,
                    "-y",
                    "-i", inp_path,
                    "-ar", "16000",
                    "-ac", "1",
                    temp_path,
                ],
                check=True,
                capture_output=True,
                text=True,
            )

        client = GnaniSTTClient()  # CHANGED: Now inside try

        result = await run_in_threadpool(
            client.transcribe,
            temp_path,
            language_code='en-IN'
        )

        print(f"the result is {result['transcript']}")
        transcript = result['transcript']

        return {'transcript': transcript}

        # answer = retrieve(result['transcript'], vectors=vectors, pics=chunks, k=2)

    except AuthenticationError:  # CHANGED: Server's Gnani credentials failed
        raise HTTPException(
            status_code=503,  # CHANGED: Was 401
            detail="Transcription is temporarily unavailable."  # CHANGED: Generic message
        )

    except APIError:  # CHANGED: Removed unused variable e
        raise HTTPException(
            status_code=502,
            detail="The transcription service encountered an error."  # CHANGED: User-friendly message
        )

    except InvalidAudioError:
        raise HTTPException(
            status_code=400,
            detail="Invalid audio file."
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        await file.close()
@router.post('/hear_question/',response_model=AnswerType)
def play_question(request:AnswerType):
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