import time

from fastapi import APIRouter, Depends, HTTPException
from httpx import HTTPError
from ollama import ResponseError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.tables import Applicant
from app.services.draft import Email_validator
from app.services.ollama import generate_email


MODEL_NAME = "qwen3:1.7b"
PROMPT_VERSION = "cold_email_v1"


router = APIRouter(
    prefix="/api/applications",
    tags=["Drafts"],
)


@router.post(
    "/{application_id}/generate-draft",
    response_model=Email_validator,
    status_code=200,
)
def generate_draft(
    application_id: int,
    db: Session = Depends(get_db),
) -> Email_validator:

    application = db.get(Applicant, application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    student = application.student

    recipient = application.recipient_name or "Hiring Team"

    github_line = (
        f"GitHub: {student.github_url}"
        if student.github_url
        else ""
    )

    prompt = f"""
Create a professional job application email under 150 words.

Rules:
- Use only the information provided below.
- Do not invent any skills, experience, links or facts.
- Do not turn job requirements into student experience.
- Keep the email concise and professional.
- Proofread spelling and spacing.
- Return plain text without HTML entities.
- Return only JSON containing subject and body.

Student:
Name: {student.name}
{github_line}
Resume: {student.resume_text}

Application:
Company: {application.company_name}
Job role: {application.job_role}
Job description: {application.job_description}
Recipient: {recipient}
"""

    application.status = "PENDING"
    application.model_name = MODEL_NAME
    application.prompt_version = PROMPT_VERSION
    db.commit()

    start = time.perf_counter()

    try:
        result = generate_email(prompt=prompt)

        latency_ms = int(
            (time.perf_counter() - start) * 1000
        )

        application.generated_subject = result.subject
        application.generated_body = result.body
        application.generation_latency_ms = latency_ms
        application.status = "DRAFTED"

        db.commit()
        db.refresh(application)

        return result

    except (HTTPError, ResponseError, ValidationError) as error:
        db.rollback()

        latency_ms = int(
            (time.perf_counter() - start) * 1000
        )

        application.status = "DRAFT_FAILED"
        application.generation_latency_ms = latency_ms
        db.commit()

        raise HTTPException(
            status_code=502,
            detail="Draft generation failed",
        ) from error

    except Exception:
        db.rollback()
        raise