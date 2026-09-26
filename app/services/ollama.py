import os
from google import genai
from google.genai import types
from app.services.draft import Email_validator
from dotenv import load_dotenv
load_dotenv()
def generate_email(prompt:str)->Email_validator:
    api = os.getenv('GEMINI_API_KEY')
    if not api:
        raise RuntimeError('api key not found')
    client = genai.Client(
        api_key=api
    )
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config =types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=250,
            response_mime_type='application/json',
            response_schema=Email_validator
        ),
    )
    return Email_validator.model_validate_json(
        response.text
    )
