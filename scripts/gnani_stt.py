from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from tempfile import NamedTemporaryFile
import subprocess

from pathlib import Path
import os 
from gnani.stt import (
    GnaniSTTClient,
    AuthenticationError,
    InvalidAudioError,
    APIError,
)
from dotenv import load_dotenv
load_dotenv()
router = APIRouter(prefix='/api')

client = GnaniSTTClient()
@router.post('/stt_')
async def convert_to_text(file:UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(400, "Please upload an audio file.")
    content = await file.read()
    if not content:
        raise HTTPException(400,'the audio file is empty')
    if len(content)>10*1024*1024:
        raise HTTPException(413,'audio must be 10MB or smaller')
    suffix = Path(file.filename or 'recording.webm').suffix
    temp_path = None
    try:
        with NamedTemporaryFile(
            delete = False,
            suffix = suffix
        )as temp:
            temp.write(content)
            temp_path = temp.name
            wav_path = temp_path + ".wav"

        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", temp_path,
                "-ac", "1",
                "-ar", "16000",
                "-c:a", "pcm_s16le",
                wav_path,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        result = await run_in_threadpool(
            client.transcribe,
            wav_path,
            language_code='en-IN'
        )
        transcript = result.get('transcript','').strip()
        if not transcript:
            raise HTTPException(422,'No speech detected ')
        return {'transcript':transcript}
    except AuthenticationError:
        raise HTTPException(503, "Speech service authentication failed.")
    except InvalidAudioError:
        raise HTTPException(400, "The audio format is invalid or unsupported.")
    except APIError as e:
        raise HTTPException(
            502,
            f"Speech service error (status {getattr(e, 'status_code', 'unknown')}).",
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        await file.close()




        
