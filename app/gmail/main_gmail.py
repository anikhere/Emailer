from app.gmail.drafter import DraftSaveResponse,DraftUpdate
from fastapi import APIRouter, Depends, HTTPException
from httpx import HTTPError
from ollama import ResponseError
from app.database.tables import Applicant
from sqlalchemy.orm import Session
from app.database.connection import get_db

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.tables import Applicant
router = APIRouter(
    prefix="/api/applications",
    tags=["Drafts"],
)
@router.patch(
    "/{application_id}/draft",
    response_model=DraftSaveResponse,
    status_code=200,
)
def save_draft(
    application_id: int,
    draft: DraftUpdate,
    db: Session = Depends(get_db),
):
    application = db.get(
        Applicant,
        application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    if application.status not in {
        "DRAFTED",
        "READY_TO_SEND",
    }:
        raise HTTPException(
            status_code=409,
            detail="Application has no valid draft",
        )

    application.final_subject = draft.subject
    application.final_body = draft.body
    application.status = "READY_TO_SEND"

    db.commit()
    db.refresh(application)

    return DraftSaveResponse(
        application_id=application.id,
        final_subject=application.final_subject,
        final_body=application.final_body,
        status=application.status,
        updated_at=application.updated_at,
    )