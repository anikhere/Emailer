from ollama import chat,Client
from app.services.draft import Email_validator
def generate_email(prompt:str)->Email_validator:
    client = Client(
        host="http://localhost:11434",
        timeout = 20.0
    )

    response = client.chat(
        model="qwen3:1.7b",
        messages=[{"role": "user", "content": prompt}],
        format=Email_validator.model_json_schema(),
        think=False,
        keep_alive='10m',
        options={
            'temperature':0.2,
            'num_predict':250
        }
    )
    return Email_validator.model_validate_json(
        response.message.content
    )