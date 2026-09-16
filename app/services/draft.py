from pydantic import BaseModel, Field, field_validator
class Email_validator(BaseModel):
    subject:str = Field(min_length=1,max_length=100)
    body:str = Field(min_length=1)
    @field_validator('subject','body')
    @classmethod
    def reject_empty(cls,value:str) ->str:
        value = value.strip()
        if not value:
            raise ValueError(f'Field cannot be empty')
        return value
    @field_validator('body')
    @classmethod
    def limit_words(cls,value:str)->str:
        if len(value.split()) > 150:
            raise ValueError('Email body exceeded more than 150 words')
        return value

