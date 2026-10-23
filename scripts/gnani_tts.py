from dotenv import load_dotenv
import winsound
from pathlib import Path

from gnani.tts import (
    GnaniTTSClient,
    AudioConfig,
    AuthenticationError as TTSAuthenticationError,
    APIError as TTSAPIError,
)

load_dotenv()


def Hear(question):
    if not isinstance(question, str) or not question.strip():
        raise ValueError("Question must be non-empty")

    try:
        client = GnaniTTSClient()

        audio_config = AudioConfig(
            container="wav",
            sample_rate=48000,
            encoding="linear_pcm"
        )

        audio = client.synthesize(
            question,
            voice="Kaveri",
            model="timbre-v2.5",
            language="en-IN",
            audio_config=audio_config
        )

        return audio

    except TTSAuthenticationError:
        print("Authentication failed. Check your Gnani API key.")
        return None

    except TTSAPIError as error:
        print(f"Gnani TTS API error: {error}")
        return None

    except Exception as error:
        print(f"Unexpected TTS error: {error}")
        return None


# try:
#     question = "Tell me about a project you built using Python and Google Gemini."

#     audio = Hear(question)

#     if audio:
#         output_path = Path("kaveri_test.wav")
#         output_path.write_bytes(audio)
#         print("Audio file saved successfully.")

#         winsound.PlaySound(
#             str(output_path.resolve()),
#             winsound.SND_FILENAME
#         )
#         print("Audio played successfully.")

# except ValueError as error:
#     print(f"Invalid input: {error}")

# except OSError as error:
#     print(f"File or audio playback error: {error}")