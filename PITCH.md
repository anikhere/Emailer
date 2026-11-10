# InternBridge — one page

**One-page pitch:** [PITCH.md](PITCH.md)
**Live app:** https://emailer-4jh4.onrender.com

## The problem

Nobody teaches you how to ask a stranger for a job. You guess at the email, you
practise the interview on nobody, and two weeks later you cannot remember who you
already wrote to. Three guesses, three places to get it wrong.

## How you use it

**1. Add your resume once.** Paste the text or upload the PDF. It is saved against
your profile, and every part of the app reuses it — you never re-enter anything.

**2. Emailer — the draft.** Say what you want in a sentence, typed or spoken out
loud. It writes the email from your resume and your instruction, so the result is
specific to you and to the company rather than a template. You edit it and copy it
into Gmail. It removes the blank page and the copy-paste busywork.

**3. Interview Coach — the practice.** It writes three questions from your resume,
not generic ones. You answer by typing or speaking. Each answer is scored on
relevance, specificity and structure, it shows the exact line from your resume it
judged you against, and it tells you what to fix — so the next answer is better
than the last one.

**4. Tracker — the record.** Every draft you generate lands here. You mark it Sent,
Replied or Closed. Cleaner than hunting through a cluttered inbox for "did I ever
reply to them?"

## What it does not do

It does not send email for you, and it does not know whether anyone opened one.
There is no tracking pixel and no "delivered" badge — when a row says Sent, it is
because you clicked Sent. The score is a practice estimate, not a verdict. And if it
cannot find something in your resume, it says so instead of inventing a reason.

## Gnani AI technology

**Prisma**, speech to text (`POST /stt/v3`) — spoken instructions and spoken answers.
Audio is converted to 16 kHz mono WAV before sending.

**Timbre**, text to speech (`timbre-v2.5`, voice Kaveri) — reads each question aloud,
fetched the moment the question appears.

FastAPI · PostgreSQL on Neon · deployed on Render · plain HTML, CSS and JavaScript ·
Gemini for embeddings, drafting and scoring.

## What building it taught me

I leaned on AI to write code faster than I understood it, and learned that gets you
a demo, not a product. Once I found a database query that could never have run, and
once a page that lied about sending an email. Both looked finished. Both only
surfaced when I stopped accepting the code and read it. So I cut features instead of
adding them.

**Next:** reply detection through the Gmail API, which means asking for read
permission properly instead of pretending to have it.

`#GnaniAI` `#GreatIndianAIInternshipChallenge`
