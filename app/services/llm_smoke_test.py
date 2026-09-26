from app.services.ollama import generate_email
import time



prompt = """
Write a professional cold email under 150 words.

Student: Husain
Resume: Python developer who built a Django project.
Company: Google
Role: Backend Engineering Intern
Job description: Looking for Python and API experience.
Recipient: Harshil

Use only the provided facts.
Return a subject and body.
"""
start = time.perf_counter()
draft = generate_email(prompt)
end = time.perf_counter()

print(f'Subject {draft.subject}')
print(f'Body {draft.body}')
print(f'words=={len(draft.body.split())}')
print(f"Time taken: {end - start:.2f} seconds")