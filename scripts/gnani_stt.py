from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from tempfile import NamedTemporaryFile
import subprocess
import shutil
import os
from pathlib import Path

from gnani.stt import (
    GnaniSTTClient,
    AuthenticationError,
    InvalidAudioError,
    APIError,
)
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix='/api')


def get_ffmpeg():
    """Find an ffmpeg binary. Env var first, then PATH, then the
    static binary that ships with the imageio-ffmpeg package."""
    path = os.getenv("FFMPEG_PATH") or shutil.which("ffmpeg")
    if path:
        return path
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


@router.post('/stt_')
async def convert_to_text(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(400, "Please upload an audio file.")

    content = await file.read()
    if not content:
        raise HTTPException(400, 'the audio file is empty')
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, 'audio must be 10MB or smaller')

    suffix = Path(file.filename or 'recording.webm').suffix
    temp_path = None
    wav_path = None

    try:
        with NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp:
            temp.write(content)
            temp_path = temp.name
            wav_path = temp_path + ".wav"

        binary = get_ffmpeg()
        if binary is None:
            raise HTTPException(
                503,
                "Audio conversion is unavailable on this server.",
            )

        try:
            await run_in_threadpool(
                subprocess.run,
                [
                    binary, "-y",
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
        except FileNotFoundError:
            raise HTTPException(
                503,
                "Audio conversion is unavailable on this server.",
            )
        except subprocess.CalledProcessError:
            raise HTTPException(
                400,
                "That recording could not be read. Please record again.",
            )

        client = GnaniSTTClient()

        result = await run_in_threadpool(
            client.transcribe,
            wav_path,
            language_code='en-IN'
        )

        transcript = result.get('transcript', '').strip()
        if not transcript:
            raise HTTPException(422, 'No speech detected')

        return {'transcript': transcript}

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
        for path in (temp_path, wav_path):
            if path and os.path.exists(path):
                os.remove(path)
        await file.close()
