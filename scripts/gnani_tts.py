
from dotenv import load_dotenv

from gnani.tts import (
    GnaniTTSClient,
    AudioConfig,
    AuthenticationError as TTSAuthenticationError,
    APIError as TTSAPIError,
)

load_dotenv()

# Questions repeat for the whole session - synthesise each one once.
_cache = {}
MAX_CACHE = 32


def Hear(question, sample_rate=16000):
    if not isinstance(question, str) or not question.strip():
        raise ValueError("Question must be non-empty")

    key = question.strip()
    if key in _cache:
        return _cache[key]

    try:
        client = GnaniTTSClient()

        audio_config = AudioConfig(
            container="wav",
            sample_rate=sample_rate,
            encoding="linear_pcm"
        )

        audio = client.synthesize(
            key,
            voice="Kaveri",
            model="timbre-v2.5",
            language="en-IN",
            audio_config=audio_config
        )

        if audio and len(_cache) < MAX_CACHE:
            _cache[key] = audio

        return audio

    except TTSAuthenticationError:
        print("Authentication failed. Check your Gnani API key.")
        raise

    except TTSAPIError as error:
        print(f"Gnani TTS API error: {error}")
        raise

    except Exception as error:
        print(f"Unexpected TTS error: {error}")
        raise