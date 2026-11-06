InternBridge
One place for a student's internship outreach: write the email, practise the
interview, keep track of who you wrote to.

Built for the Great Indian AI Internship Challenge (Gnani AI).

The problem
Applying for internships is repetitive and lonely. You write the same cold email
again and again, you get no interview practice before the real one, and after two
weeks you cannot remember who you wrote to or when.

InternBridge does the three things that actually repeat:

Module	What it does
Emailer	Reads your resume, takes an instruction in your own words (typed or spoken), and writes one specific email. You edit it, regenerate it, and send it yourself from Gmail.
Interview Coach	Generates three questions from your resume, takes your answers by text or voice, and scores each one on relevance, specificity and structure with evidence taken from your resume.
Application Tracker	Every email you generate appears here. You mark it Sent, Replied or Closed.
What it deliberately does not do
This matters more than the feature list.

It never sends email for you. It prepares a draft. You press send in your
own Gmail. The success screen says the draft is ready — not sent.
It does not track whether a recruiter opened, read or replied. There is no
Gmail read access, no pixel, no "delivered" badge. A row moves to Sent
because you clicked it, and that click is the only evidence.
The interview score is a practice estimate, not a verdict. It measures your
answer against the evidence in your resume, nothing else.
It does not invent feedback. If your resume does not support a claim, it
says so and quotes what it found. If a claim is not in the resume, it is
flagged rather than accepted.
Where a number appears, it came from the database or from the model scoring your
answer. No decorative statistics.

How it works
text

resume (PDF or pasted text)
        |
        v
  chunk + Gemini embeddings  -->  stored per student
        |
   +----+-----------------+----------------------+
   |                      |                      |
   v                      v                      v
Emailer              Interview Coach        Tracker
instruction         3 questions            rows created
(text or Gnani STT) from resume            automatically
   |                      |
   v                      v
Gemini draft          answer by text
   |                  or Gnani STT
   v                      |
Gmail compose link        v
you send it          Gemini scores 0-2 on
                     relevance / specificity
                     / structure
                          |
                          v
                     results page
Speech — Gnani STT (/api/stt_) turns recorded audio into text. Recorded
audio is converted to 16 kHz mono WAV with ffmpeg before it is sent. Gnani TTS
reads the interview question out loud.

Text — Google Gemini. gemini-3.5-flash-lite for question generation,
drafting and answer scoring, with structured output so the response is a typed
object, not free text that has to be parsed. gemini-embedding-2 for resume
embeddings, sent as a single batched call.

Storage — PostgreSQL via SQLAlchemy. Resume chunks and their vectors are
stored per student, so one student's resume can never be used to score another's
answer.

Running it locally
Requirements: Python 3.12+, PostgreSQL, ffmpeg.

Bash

git clone https://github.com/anikhere/Emailer
cd Emailer

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then fill it in
docker compose up -d db            # or point DATABASE_URL at your own Postgres

uvicorn app.main:app --reload
Open http://127.0.0.1:8000. Interactive API docs at /docs.

With Docker:

Bash

docker build -t internbridge .
docker run --env-file .env -p 8000:8000 internbridge
Environment
Variable	Purpose
DATABASE_URL	PostgreSQL connection string (postgresql+psycopg://…)
GEMINI_API_KEY	Embeddings, drafting, scoring
GNANI_API_KEY	Speech to text and text to speech
FFMPEG_PATH	Optional, if ffmpeg is not on PATH
Pages
Route	Page
/	Landing
/dash	Dashboard with the three modules
/applicant	Emailer
/interview	Interview Coach
/final_dash	Results after three answers
/application-tracker	Application Tracker
API
Method	Path	Purpose
POST	/api/students	Create a profile and process the resume
GET	/api/students/{id}	Read a profile
POST	/api/student/pdf	Extract text from a resume PDF
POST	/api/students/{id}/applications	Create an application row
GET	/api/students/{id}/applications	List a student's applications
PATCH	/api/applications/{id}/status	Move a row: Drafted / Sent / Replied / Closed
POST	/api/{application_id}/generate-draft	Generate subject and body
POST	/interview/generate	Generate three questions from a resume
POST	/api/interview_answer/	Score one answer
POST	/api/hear_question/	Read a question aloud (Gnani TTS)
POST	/api/stt_	Transcribe recorded audio (Gnani STT)
Stack
FastAPI · SQLAlchemy · PostgreSQL · Google Gemini · Gnani (Prisma STT, TTS) ·
vanilla HTML, CSS and JavaScript. No frontend framework, no build step.

Credits
Built for the Great Indian AI Internship Challenge by Gnani AI.

#GnaniAI #GreatIndianAIInternshipChallenge

