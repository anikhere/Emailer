import os
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from google import genai
from google.genai import errors, types
from pydantic import BaseModel

from app.services.rag import retrieve

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
FILE_PATH = Path("saved_file.npz")


class AnswerCheck(BaseModel):
    named_project: bool
    evidence: str
    unsupported_claims: list[str]
    tip: str


def check_answer(answer, question, file_path=FILE_PATH):
    data = np.load(file_path, allow_pickle=False)
    chunks = data["chunks"].tolist()
    vectors = data["vector"]
    top = retrieve(answer, vectors, chunks, k=2)
    evidence = "\n---\n".join(top)

    prompt = f"""Check a student's interview answer using ONLY the resume chunks below.
Use no outside knowledge.

Question: {question}
Answer: {answer}
Resume chunks:
{evidence}

Rules:
- named_project: true only if the answer names a project that appears in the chunks.
- evidence: quote the supporting line, or write "not listed in your profile".
- unsupported_claims: unsupported_claims: Identify positive claims about skills, projects, or experience that are not supported by the resume chunks. If the answer says the student has experience, check whether the chunks support it. If the answer admits they lack experience or says they do not know a tool, do not flag that statement. Do not assume a claim is true just because the student says it.
- The answer came from speech recognition, so technical words may be misheard (Docker as doctor).
- tip: one short sentence."""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnswerCheck,
            ),
        )
        return response.parsed
    except errors.APIError as e:
        print(f'the error is {e}')
        return None 

if __name__ == "__main__":
    import os
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from google import genai
from google.genai import errors, types
from pydantic import BaseModel

from app.services.rag import retrieve

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
FILE_PATH = Path("saved_file.npz")


class AnswerCheck(BaseModel):
    named_project: bool
    evidence: str
    unsupported_claims: list[str]
    tip: str


def check_answer(answer, question, file_path=FILE_PATH):
    data = np.load(file_path, allow_pickle=False)
    chunks = data["chunks"].tolist()
    vectors = data["vector"]
    top = retrieve(answer, vectors, chunks, k=2)
    evidence = "\n---\n".join(top)

    prompt = f"""Check a student's interview answer using ONLY the resume chunks below.
Use no outside knowledge.

Question: {question}
Answer: {answer}
Resume chunks:
{evidence}

Rules:
- named_project: true only if the answer names a project that appears in the chunks.
- evidence: quote the supporting line, or write "not listed in your profile".
- unsupported_claims: unsupported_claims: Identify positive claims about skills, projects, or experience that are not supported by the resume chunks. If the answer says the student has experience, check whether the chunks support it. If the answer admits they lack experience or says they do not know a tool, do not flag that statement. Do not assume a claim is true just because the student says it.
- The answer came from speech recognition, so technical words may be misheard (Docker as doctor).
- tip: one short sentence."""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnswerCheck,
            ),
        )
        return response.parsed
    except errors.APIError as e:
        print(f'the error is {e}')
        return None 

if __name__ == "__main__":
    questions = [
    "Tell me about a project you built.",
    "Which technologies did you use?",
    "What was your role in the project?"
]

    answers = [
        "I built an Emailer API using FastAPI.",
        "I used FastAPI and PostgreSQL.",
        "I designed the API endpoints and database integration."
    ]

    results = []
    for ques,answ in zip(questions,answers):
        result = check_answer(answer=answ,question=ques)
        results.append(result)
    for i,res in enumerate(results):
        print(f'Questions {i}')
        if res is not None:
            print(res.model_dump())
        else:
            print(f'could not evaluate the answer')