import os
import re
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from google import genai

load_dotenv()

FILE_NAME = "sample_resume.txt"
CACHE_FILE = Path("saved_file.npz")
DB_FILE = Path('saved_chunks.npz')
K = 2  


def chunks_resume(resume):
    pieces = re.split(r"\n\s*\n", resume)
    return [p.strip() for p in pieces if p.strip()][:100]


def embed(chunks):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    rows = []
    for c in chunks:
        result = client.models.embed_content(
            model="gemini-embedding-2", contents=c
        )
        rows.append(result.embeddings[0].values)
    vector = np.array(rows)
    vector = vector / np.linalg.norm(vector, axis=1, keepdims=True)
    return vector


def retrieve(question, vectors, pics, k=3):
    q = embed([question])[0]
    scores = vectors @ q
    best = np.argsort(scores)[::-1][:k]
    return [pics[i] for i in best]


def save_vec_chunks(chun, vec, file_):
    np.savez(file_, chunks=chun, vector=vec)


eval_questions = [
    {"question": "What kind of role i am interested in?",
     "must_contain": "Python developer interested"},
    {"question": "What programming languages and tools does i know?",
     "must_contain": "SKILLS"},
    {"question": "What experience do i have as a backend developer?",
     "must_contain": "Backend Developer Intern"},
    {"question": "What did I build in his Resume Analyzer project?",
     "must_contain": "Resume Analyzer"},
    {"question": "Do i have knowledge of Docker and AWS?",
     "must_contain": "SKILLS"},  
    {"question": "Has he built anything that uses an AI model?",
     "must_contain": "Google Gemini"},
    {"question": "Mere paas kaunse projects hain?",
     "must_contain": "Resume Analyzer"},
]


def run_eval(chunks, vectors, k=K):
    score = 0
    for item in eval_questions:
        top = retrieve(item["question"], vectors, chunks, k=k)
        hit = any(item["must_contain"] in c for c in top)
        score += hit
        print("PASS" if hit else "FAIL", "|", item["question"])
        print("    top chunk:", top[0][:60].replace("\n", " "))
    print(f"\nRetrieval score (top-{k}): {score}/{len(eval_questions)}")


if __name__ == "__main__":
    with open(FILE_NAME, encoding="utf-8") as f:
        resume_text = f.read()

    # if CACHE_FILE.exists():
    #     data = np.load(CACHE_FILE, allow_pickle=False)
    #     chnks = data["chunks"].tolist()
    #     vector = data["vector"]
    #     print("Loaded saved embeddings")
    # else:
    #     chnks = chunks_resume(resume_text)
    #     vector = embed(chnks)
    #     save_vec_chunks(chnks, vector, CACHE_FILE)
    #     print("Created and saved embeddings")

    # print("Number of chunks:", len(chnks))
    # run_eval(chnks, vector)