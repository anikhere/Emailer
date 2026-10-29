
import io

from pydantic import BaseModel, Field
from pypdf import PdfReader, errors as pdf_errors
from fastapi import APIRouter, UploadFile, HTTPException, File


class Pdf(BaseModel):
    resume: str = Field(min_length=1)


router = APIRouter(
    prefix="/api/student",
    tags=["pdf_accept"]
)


@router.post("/pdf")
def Accept_pdf(resume: UploadFile = File(...)):
    if resume.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a PDF."
        )

    content = resume.file.read(5 * 1024 * 1024 + 1)

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="PDF must be 5 MB or smaller."
        )

    try:
        pdf = PdfReader(io.BytesIO(content))

        text = "\n".join(
            page.extract_text() or ""
            for page in pdf.pages
        ).strip()

    except (pdf_errors.PdfReadError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="The PDF is invalid or unreadable."
        )

    if not text:
        raise HTTPException(
            status_code=422,
            detail="No readable text found in the PDF."

        )
    
    validated_pdf = Pdf(resume=text)

    return {"resume": validated_pdf.resume}
