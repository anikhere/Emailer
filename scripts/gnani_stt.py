from dotenv import load_dotenv
import numpy as np
from app.services.rag import retrieve                          
from pathlib import Path 
from gnani.stt import (
    GnaniSTTClient,
    AuthenticationError,
    InvalidAudioError,
    APIError,
)

BASE = Path(__file__).resolve().parent.parent
BASE = BASE / '.wav_files'
print(BASE)
load_dotenv()
client = GnaniSTTClient()
clips = [
    ('docker_english.wav','en-IN')
    # ('docker_gujrati.wav','gu-IN'),
    # ('docker_hinglish.wav','hi-IN')
]
data = np.load('saved_file.npz',allow_pickle=False)
chunks = data['chunks'].tolist()
vectors = data['vector']

for name,lang in clips:
    path = BASE/name
    if not path.exists():
        print(f'missing ==={path}')
        continue
    try :
        result = client.transcribe(str(path),language_code=lang)
        print(f'{lang} | {name} | {result['transcript']}')
        answer = retrieve(result['transcript'],vectors=vectors,pics=chunks,k=2)
        print(f'the starboy is {answer[0][:60].replace('\n','')}')
    except AuthenticationError:
        print(f'the key problem is not found in the api')
    except APIError as e:
        print(f'{name} | has an api error {e.status_code}==={e}')
    except InvalidAudioError as e:
        print(f'{name}| bad_audio error occured === {e}')
