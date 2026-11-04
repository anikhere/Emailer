/* ============================================================
   Interview Coach — updated
   Changes in this file (nothing else altered):
     1. Submit now shows a loading state: button disabled,
        label "Evaluating...", status message under the card.
     2. A finally block always restores the button, even on error.
     3. Elapsed time is printed after each evaluation, so you can
        see how long the round trip actually takes.
     4. Removed one stray duplicated initialiser that ran at load.
     5. Live timer under the submit button: counts up while waiting,
        shows the final time for 4 s, then hides itself.
     6. Feedback now paints immediately after Submit, instead of
        only appearing after Next/Previous.
   ============================================================ */

const answer = document.querySelector('#answer');
const button = document.querySelector('#submit-button');
const questionElement = document.querySelector('#question');
const rep_but = document.querySelector('#replay-button');
const feed = document.querySelector('#status-message');
const micButton = document.querySelector('#mic-button');
const micStatus = document.querySelector('#mic-status');
const trans_button = document.querySelector('#transcribe-button');
const evi = document.querySelector('#evidence');
const claim = document.querySelector('#unsupported-claims');
const questionsContainer = document.querySelector('#questions-container');
const tip = document.querySelector('#tip');
const recordedAudio = document.querySelector('#recorded-audio');
const prev = document.querySelector('#previous-button');
const next = document.querySelector('#next-button');
const evalTimer = document.querySelector('#evaluate-timer');

let currentQuestionIndex = 0;
let questions = [];
let interviewResults = [null, null, null];

prev.disabled = true;

async function loadQuestion() {
    try {
        const saved_questions = sessionStorage.getItem('inter_ques');
        questions = saved_questions ? JSON.parse(saved_questions) : null;

        if (!questions) {
            const student_id = sessionStorage.getItem('student_id');
            if (!student_id) {
                throw new Error('the student id is not found');
            }
            const Student_response = await fetch(`/api/students/${student_id}`);
            if (!Student_response.ok) {
                throw new Error("failed to fetch the id");
            }
            const Student_rep = await Student_response.json();
            const resume = Student_rep.resume_text;
            const respond = await fetch(`/interview/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resume: resume
                })
            });
            if (!respond.ok) {
                throw new Error('COuld not generate questions');
            }
            const data = await respond.json();
            questions = data.questions;
            sessionStorage.setItem(
                'inter_ques',
                JSON.stringify(questions)
            );
        }
        questionElement.textContent = questions[currentQuestionIndex];
    } catch (error) {
        console.error(error);
        questionElement.textContent = 'could not load the questions';
    }
    prev.disabled = true;
    next.disabled = !questions || questions.length <= 1;
}

/* Paints one answer's feedback into the card.
   Previously this only lived inside Nav_direction, which is why
   feedback appeared only after pressing Next or Previous. */

function renderFeedback(feedback) {
    evi.textContent = feedback?.evidence || '';
    tip.textContent = feedback?.tip || '';

    const claims = Array.isArray(feedback?.unsupported_claims)
        ? feedback.unsupported_claims.filter(Boolean)
        : [];
    claim.textContent = claims.length ? claims.join(', ') : 'None found.';

    if (!feedback) return '';
    return feedback.named_project
        ? 'A project from your profile was identified.'
        : 'No project from your profile was identified.';
}

function clearFeedback() {
    evi.textContent = '';
    tip.textContent = '';
    claim.textContent = '';
    feed.textContent = '';
}

function Nav_direction(dire) {

    // Save the current question's answer
    interviewResults[currentQuestionIndex] ??= {
        answer: '',
        feedback: null
    };

    interviewResults[currentQuestionIndex].answer = answer.value;

    // Move to the next or previous question
    const newIndex = currentQuestionIndex + dire;

    if (newIndex < 0 || newIndex >= questions.length) return;

    currentQuestionIndex = newIndex;

    // Initialise destination question
    interviewResults[currentQuestionIndex] ??= {
        answer: '',
        feedback: null
    };

    const result = interviewResults[currentQuestionIndex];

    // Display question and restore its answer
    questionElement.textContent = questions[currentQuestionIndex];
    answer.value = result.answer;

    // Clear previous feedback
    clearFeedback();

    // Restore feedback if it was already evaluated
    if (result.feedback) {
        const note = renderFeedback(result.feedback);
        feed.textContent = note;
    }

    // Update navigation buttons
    prev.disabled = currentQuestionIndex === 0;
    next.disabled = currentQuestionIndex === questions.length - 1;
}

next.addEventListener('click', () => Nav_direction(1));
prev.addEventListener('click', () => Nav_direction(-1));

/* ---------- loading state + live timer ---------- */

let evalTimerId = null;
let evalStartedAt = 0;

function startEvalTimer() {
    if (!evalTimer) return;
    evalStartedAt = performance.now();
    evalTimer.hidden = false;
    evalTimer.classList.add('is-running');
    evalTimer.textContent = 'Evaluating\u2026 0.0s';

    evalTimerId = setInterval(() => {
        const s = (performance.now() - evalStartedAt) / 1000;
        evalTimer.textContent = `Evaluating\u2026 ${s.toFixed(1)}s`;
    }, 100);
}

function stopEvalTimer(finalSeconds) {
    if (!evalTimer) return;
    clearInterval(evalTimerId);
    evalTimerId = null;
    evalTimer.classList.remove('is-running');

    if (typeof finalSeconds === 'number') {
        evalTimer.textContent = `Done in ${finalSeconds.toFixed(1)}s`;
        setTimeout(() => { if (!evalTimerId) evalTimer.hidden = true; }, 4000);
    } else {
        evalTimer.hidden = true;
    }
}

function setEvaluating(isBusy) {
    button.disabled = isBusy;
    button.textContent = isBusy ? 'Evaluating...' : 'Submit Answer';
    answer.disabled = isBusy;

    if (isBusy) {
        clearFeedback();
        feed.textContent = 'Your response is being evaluated. Please wait...';
        feed.className = '';
        startEvalTimer();
    }
}

/* ---------- submit ---------- */

async function send_que_ans() {
    const startedAt = performance.now();

    try {
        const answerText = answer.value.trim();

        if (!answerText) {
            throw new Error('Please enter your answer.');
        }

        setEvaluating(true);

        const response = await fetch('/api/interview_answer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: questionElement.textContent,
                answer: answerText,
                student_id: (sessionStorage.getItem('student_id'))
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log('422 Details:', JSON.stringify(data.detail, null, 2));

            throw new Error(
                typeof data.detail === 'string'
                    ? data.detail
                    : 'The answer could not be evaluated. Please try again.'
            );
        }

        interviewResults[currentQuestionIndex] = {
            answer: answerText,
            feedback: data
        };

        const seconds = (performance.now() - startedAt) / 1000;
        console.log('Answer evaluated in', seconds.toFixed(2), 'seconds');

        // Paint the feedback right away instead of waiting for a nav click.
        const note = renderFeedback(data);

        stopEvalTimer(seconds);
        feed.textContent = `Evaluated in ${seconds.toFixed(1)}s.${note ? ' ' + note : ''}`;

        // Redirect after all three questions are evaluated
        const allCompleted = interviewResults.every(
            result => result && result.feedback
        );

        if (currentQuestionIndex === questions.length - 1 && allCompleted) {
            sessionStorage.setItem("interview_report", JSON.stringify({
                questions: questions,
                results: interviewResults
            }));

            window.location.href = "/final_dash";
            return;
        }

    } catch (error) {
        console.error('Error:', error.message);
        feed.textContent = error.message;
        feed.className = 'error';
    } finally {
        setEvaluating(false);

        // If the request failed, hide the timer instead of leaving it running.
        if (evalTimerId) stopEvalTimer();
    }
}

button.addEventListener('click', send_que_ans);

rep_but.onclick = async () => {
    try {
        const response = await fetch('/api/hear_question/', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                question: questionElement.textContent.trim()
            })
        });
        if (!response.ok) {
            throw new Error('could not generate the audio');
        }
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(error => console.error("Playback failed:", error));

    } catch (error) {
        console.error('audio error:', error);
        feed.textContent = error.message;
    }
};

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let recorded_blobb = null;

micButton.onclick = async () => {
    console.log("Microphone clicked");

    try {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            console.log("Stopping recording manually");
            mediaRecorder.stop();
            return;
        }

        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        console.log("Microphone permission granted");

        audioChunks = [];
        mediaRecorder = new MediaRecorder(audioStream);

        mediaRecorder.onstart = () => {
            console.log("Recording started");
            micStatus.textContent = "Recording... speak now.";

            micButton.textContent = "Stop Recording";

            micButton.classList.add("recording");
        };

        mediaRecorder.ondataavailable = (event) => {
            console.log("Audio chunk size:", event.data.size);

            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error("Recorder error:", event.error);

            micButton.classList.remove("recording");

            micButton.textContent = "🎤 Start Recording";

            micStatus.textContent =
                event.error?.message || "Recording failed. Please try again.";

            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }
        };

        mediaRecorder.onstop = async () => {
            console.log("Recording stopped. Chunks:", audioChunks.length);

            micButton.classList.remove("recording");

            micButton.textContent = "🎤 Start Recording";

            const blob = new Blob(audioChunks, {
                type: mediaRecorder.mimeType
            });

            console.log("Audio size:", blob.size, "bytes");
            console.log("Audio type:", blob.type);

            recordedAudio.onloadedmetadata = () => {
                console.log("Duration:", recordedAudio.duration);
            };
            recordedAudio.onerror = () => {
                console.log("Playback error:", recordedAudio.error);
            };

            console.log("WebM supported:",
                MediaRecorder.isTypeSupported("audio/webm;codecs=opus"));
            console.log("Ogg supported:",
                MediaRecorder.isTypeSupported("audio/ogg;codecs=opus"));
            console.log("MP4 supported:",
                MediaRecorder.isTypeSupported("audio/mp4"));

            recordedAudio.src = URL.createObjectURL(blob);
            recordedAudio.load();

            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }

            micStatus.textContent = "Recording stopped.";
            recorded_blobb = blob;
        };

        mediaRecorder.start();

    } catch (error) {
        console.error("Microphone error:", error);

        micButton.classList.remove("recording");
        micButton.textContent = "🎤 Start Recording";

        micStatus.textContent =
            error.message || "Could not start recording. Please try again.";

        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
    }
};

loadQuestion();

async function Bolbb_transcribe(Blobb) {
    const form_data = new FormData();
    form_data.append('file', Blobb, 'recording.webm');

    try {
        micStatus.textContent = 'Transcribing...';

        const response = await fetch("/api/stt", {
            method: "POST",
            body: form_data
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Transcription failed.');
        }

        answer.value = data.transcript;
        micStatus.textContent = 'Transcription is completed';

        console.log('Transcript', data.transcript);

    } catch (error) {
        console.error('Transcription error', error);
        micStatus.textContent = error.message;
    }
}

trans_button.onclick = async () => {
    if (!recorded_blobb || recorded_blobb.size === 0) {
        console.error('some error occured');
        micStatus.textContent = 'Please record a proper sound';
        return;
    }
    await Bolbb_transcribe(recorded_blobb);
};
