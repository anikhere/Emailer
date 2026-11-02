import os
from app.services.rag import retrieve, load_student_resume

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types
from pydantic import BaseModel

load_dotenv()


class AnswerCheck(BaseModel):
    named_project: bool
    evidence: str
    unsupported_claims: list[str]
    tip: str


def check_answer(answer, question, student_id):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    chunks, vectors = load_student_resume(student_id)
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
- unsupported_claims: Identify positive claims about skills, projects, or experience that are not supported by the resume chunks. If the answer says the student has experience, check whether the chunks support it. If the answer admits they lack experience or says they do not know a tool, do not flag that statement. Do not assume a claim is true just because the student says it.
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

