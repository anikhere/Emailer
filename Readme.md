# InternBridge

**Live app: <https://emailer-4jh4.onrender.com>**

Write the internship email, practise the interview, keep track of who you wrote to.

Built for the [Great Indian AI Internship Challenge] by Gnani AI.

> The live app runs on Render's free tier. If it has been idle it takes about 50
> seconds to wake the first time. Give it a moment, then it is quick.

---

## The problem

Applying for internships is a grind.

You write the same email to twenty companies. You get no practice before the real
interview. And after two weeks you genuinely forget who you wrote to.

Nobody teaches this. If your college does not have a strong placement cell, you
figure it out alone, at night, and you get it wrong a few times first.

InternBridge fixes the three things that repeat, in the order they happen.

## What is in it

**Emailer** — Give it your resume. Then tell it, in your own words, what you want
to say, typed or spoken. It writes the email. You edit it and send it from your
own Gmail.

**Interview Coach** — It reads your resume and asks three questions about what is
actually in there, not generic ones. Answer by typing or by voice. It scores each
answer and quotes the line from your resume it is judging you against, so the
number is not a black box.

**Tracker** — Every email you generate shows up here. You mark it Sent, Replied or
Closed.

## What it does not do

I want to be straight about this, because a lot of tools are not.

It does not send email for you. It writes a draft and you press send. The last
screen says your draft is ready, because that is what actually happened.

It does not know whether anyone opened your email. There is no tracking pixel and
no "delivered" badge. When a row says Sent, it is because you clicked Sent.

The interview score is a practice estimate. One opinion about one answer, not a
verdict on you.

If it cannot find something in your resume, it says it could not find it. It does
not invent a reason.

## How it works

```
resume  (PDF or pasted text)
   |
   v
split into chunks  ->  Gemini embeddings  ->  stored per student id
   |
   +------------+-------------------+------------------+
   |            |                   |                  |
   v            v                   v                  v
Emailer    3 questions         3 answers           Tracker
        from your resume      scored 0-2 on       rows created
                              relevance,
                              specificity,
                              structure
```

Your resume is the only thing used to write your email or score your answer.
Embeddings are stored per student id, so one person's resume can never be used to
judge someone else's answer.

## Built with

| | |
|---|---|
| Speech to text | **Gnani Prisma** — `POST /stt/v3`, spoken instructions and spoken answers |
| Text to speech | **Gnani Timbre** — `timbre-v2.5`, reads interview questions aloud |
| Language | Google Gemini — `gemini-3.5-flash-lite` for drafting, questions and scoring |
| Embeddings | Google Gemini `gemini-embedding-2`, one batched call per resume |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Frontend | plain HTML, CSS and JavaScript. No framework, no build step |

Recorded audio is converted to 16 kHz mono WAV before it is sent to Prisma. If
ffmpeg is missing, `imageio-ffmpeg` supplies a static binary, so nothing needs to
be installed by hand.

## Running it locally

You need Python 3.12+, PostgreSQL, and ffmpeg (optional — see above).

```bash
git clone https://github.com/anikhere/Emailer
cd Emailer

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then fill it in
docker compose up -d db          # or point DBURL at your own Postgres

uvicorn app.main:app --reload
```

Open <http://127.0.0.1:8000>. API docs at `/docs`.

Create the tables once, before the first request:

```bash
python -m app.database.init__db
```

### Environment

| Variable | Required | What for |
|---|---|---|
| `DBURL` | yes | Postgres connection string, `postgresql+psycopg://…` |
| `GEMINI_API_KEY` | yes | Embeddings, drafting, answer scoring |
| `GNANI_API_KEY` | yes | Prisma speech to text, Timbre text to speech |
| `FFMPEG_PATH` | no | Only if ffmpeg is not on your `PATH` |

The database variable is **`DBURL`**. The app reads exactly that name and will
refuse to start without it.

## Pages

| Route | |
|---|---|
| `/` | landing |
| `/dash` | dashboard with the three modules |
| `/applicant` | Emailer |
| `/interview` | Interview Coach |
| `/final_dash` | results after three answers |
| `/application-tracker` | Tracker |

## API

| Method | Path | Does |
|---|---|---|
| `POST` | `/api/students` | create a profile and process the resume |
| `GET` | `/api/students/{id}` | read a profile |
| `POST` | `/api/student/pdf` | extract text from a resume PDF |
| `POST` | `/api/students/{id}/applications` | create an application |
| `GET` | `/api/students/{id}/applications` | list a student's applications |
| `PATCH` | `/api/applications/{id}/status` | Drafted / Sent / Replied / Closed |
| `POST` | `/api/{application_id}/generate-draft` | generate subject and body |
| `POST` | `/interview/generate` | three questions from your resume |
| `POST` | `/api/interview_answer/` | score one answer |
| `POST` | `/api/hear_question/` | read a question aloud |
| `POST` | `/api/stt_` | transcribe recorded audio |

Full interactive docs at `/docs` on the live app.

---

Built for the **Great Indian AI Internship Challenge** by **Gnani AI**.

`#GnaniAI` `#GreatIndianAIInternshipChallenge`
