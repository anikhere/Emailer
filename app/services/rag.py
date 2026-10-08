import json
import re
from pathlib import Path
import os 
import numpy as np
from dotenv import load_dotenv
from google import genai
load_dotenv()
def chunks_resume(resume):
    n = len(resume)
    resume = re.split(r'\n\s*\n',resume)
    chunks = [p.strip() for p in resume if not p == '']
    print(len(chunks))
    return chunks[:100]

def embed(chunks):
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    rows=[]
    for c in chunks:
        result = client.models.embed_content(model='gemini-embedding-2',contents=c)
        rows.append(result.embeddings[0].values)
    vector = np.array(rows)
    vector = vector/np.linalg.norm(vector,axis=1,keepdims=True)
    return vector

def retrieve(question,vectors,pics,k=3):
    q = embed([question])[0]
    scores = vectors @ q
    best = np.argsort(scores)[::-1][:k]
    return [pics[i] for i in best]


if __name__ == "__main__":
    print('got the question')
    question = 'i am fastapi master in the sql database'
    qu = embed(question)
    print('embedding ddone')
    with open('sample_resume.txt','r', encoding="utf-8") as f:
        print(f'opened the file')
        chuk = chunks_resume(f.read())
        embedded_f = embed(chuk)
    print(f'gegtting retrivee')
    answers = retrieve(question,vectors=embedded_f,pics=chuk)
    print('relevant answers are ====>  ')
    for answer in answers:
        print(answer)

