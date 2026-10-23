from dotenv import load_dotenv
import numpy as np
from google.genai import types, errors, Client
import os
from pydantic import BaseModel, Field
from typing import Annotated
from app.services.rag import retrieve
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File

load_dotenv()
client = Client(api_key=os.getenv('api_key'))

route = APIRouter(
    prefix='/interview',
    tags=['generate']
)

class InterviewQuestions(BaseModel):
    questions: Annotated[
        list[str],
        Field(min_length=3, max_length=3)
    ]

class Resume(BaseModel):
    resume: str

# CHANGED: Renamed the function to match its purpose.
def build_question_prompt(res_text):
    if not res_text.strip():
        raise HTTPException(
            status_code=400,
            detail='the resume cant be empty'
        )

    # CHANGED: Replaced coding instructions with interview-question instructions and included the resume.
    prompt = f"""
    Generate exactly three distinct interview questions based on the candidate's resume.

    Requirements:
    1. Focus on the candidate's projects and skills.
    2. Do not invent experience, projects, or skills not mentioned in the resume.
    3. Return questions only, without answers or explanations.
    4. Return the questions as a JSON object with a "questions" field containing a list of exactly three strings.

    Resume:
    {res_text}
    """

    # The Gemini API call remains commented out; this function only builds the prompt.
    # response = client.models.generate_content(
    #     model='gemini-3.5-flash-lite',
    #     contents=prompt,
    #     response_mime_type='application/json'
    # )

    return prompt
@route.get(
    '/generate',
    response_model=InterviewQuestions,
    status_code=200
)

def gen_ques(resume):
    prompt = build_question_prompt(resume)
    response = client.models.generate_content(
        model = 'gemini-3.5-flash-lite',
        contents = prompt,
        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=200,
            response_mime_type='application/json',
            response_schema=InterviewQuestions
        )
    )
    return InterviewQuestions.model_validate_json(
        response.text
    )
if __name__ == "__main__":
    sample_resume = """
    Python developer with experience building REST APIs using FastAPI.
    Worked with PostgreSQL for database storage.
    """

    result = gen_ques(sample_resume)
    print(result.model_dump())

    assert len(result.questions) == 3
    assert all(isinstance(q, str) for q in result.questions)

    print("Test passed!")