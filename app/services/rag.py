import json
import re
from pathlib import Path
import os 
import numpy as np
from dotenv import load_dotenv
from google import genai
from pathlib import Path
load_dotenv()
file_cache = Path('saved_file.npz')
FILE_NAME = 'sample_resume.txt'

def chunks_resume(resume):
    n = len(resume)
    resume = re.split(r'\n\s*\n',resume)
    chunks = [p.strip() for p in resume if not p == '']
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

def save_vec_chunks(chun,vec,file_):
    np.savez(
        file_,
        chunks = chun,
        vector = vec,
    )

eval_questions = [
    {
        "question": "What kind of role is Taha interested in?",
        "expected_chunk": (
            "SUMMARY\n"
            "Python developer interested in backend development "
            "and AI applications."
        ),
    },
    {
        "question": "What programming languages and tools does Taha know?",
        "expected_chunk": (
            "SKILLS\n"
            "Python, FastAPI, SQLAlchemy, PostgreSQL, Pandas, Git"
        ),
    },
    {
        "question": "What experience does Taha have as a backend developer?",
        "expected_chunk": (
            "EXPERIENCE\n"
            "Backend Developer Intern\n"
            "Built REST APIs using FastAPI and SQLAlchemy.\n"
            "Worked with PostgreSQL databases and external APIs."
        ),
    },
    {
        "question": "What did Taha build in his Resume Analyzer project?",
        "expected_chunk": (
            "PROJECTS\n"
            "Resume Analyzer\n"
            "Created a resume processing application using Python "
            "and Google Gemini."
        ),
    },
    {
        "question": "Does Taha have knowledge of Docker and AWS?",
        "expected_chunk": (
            "SKILLS\n"
            "Python, FastAPI, SQLAlchemy, PostgreSQL, Pandas, Git"
        ),
    },
]


if __name__ == "__main__":
    question = 'does this student is having knowledge in aws and docker'
    with open(FILE_NAME,'r') as f:
        file = f.read()
    if file_cache.exists():
            data = np.load(file_cache, allow_pickle=False)

            chnks = data["chunks"].tolist()
            vector = data["vector"]

            print("Loaded saved embeddings")

    else:
            chunked = chunks_resume(file)
            embedd = embed(chunked)

            save_vec_chunks(
                chun=chunked,
                vec=embedd,
                file_=file_cache
            )

            chnks = chunked
            vector = embedd

    print("Created and saved embeddings")

    pics = retrieve(
            question=question,
            vectors=vector,
            pics=chnks,
            k=3
        )

print(pics)

score = 0

for item in eval_questions:
    pics = retrieve(
        question=item["question"],
        vectors=vector,
        pics=chnks,
        k=3
    )

    if item["expected_chunk"] in pics:
        score += 1

print(f"Final retrieval score: {score}/{len(eval_questions)}")





