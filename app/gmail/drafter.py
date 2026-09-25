from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class DraftUpdate(BaseModel):
    subject: str = Field(
        min_length=1,
        max_length=100,
    )

    body: str = Field(
        min_length=1,
    )

    @field_validator("subject", "body")
    @classmethod
    def reject_blank_text(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Field cannot be empty"
            )

        return value

    @field_validator("body")
    @classmethod
    def limit_body_words(
        cls,
        value: str,
    ) -> str:
        if len(value.split()) > 150:
            raise ValueError(
                "Body cannot exceed 150 words"
            )

        return value


class DraftSaveResponse(BaseModel):
    application_id: int
    final_subject: str
    final_body: str
    status: str
    updated_at: datetime

