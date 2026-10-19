
console.log("JavaScript loaded");

const answer = document.querySelector('#answer');
const button = document.querySelector('#submit-button');
const questionElement = document.querySelector('#question');
const rep_but = document.querySelector('#replay-button');
const feed = document.querySelector('#status-message');
const micButton = document.querySelector('#mic-button');
const micStatus = document.querySelector('#mic-status');

const evi = document.querySelector('#evidence');
const claim = document.querySelector('#unsupported-claims');
const tip = document.querySelector('#tip');
const recordedAudio = document.querySelector('#recorded-audio');

async function loadQuestion() {
    try {
        const response = await fetch('/api/interview/');

        if (!response.ok) {
            throw new Error('Failed to fetch the question.');
        }

        const data = await response.json();
        questionElement.textContent = data.question;

    } catch (error) {
        console.error('Error:', error.message);
        questionElement.textContent = 'Could not load question.';
    }
}

async function send_que_ans() {
    try {
        const answerText = answer.value.trim();

        if (!answerText) {
            throw new Error('Please enter your answer.');
        }

        const response = await fetch('/api/interview_answer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: questionElement.textContent,
                answer: answerText
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to submit answer.');
        }

        evi.textContent = data.evidence;
        tip.textContent = data.tip;
        claim.textContent = data.unsupported_claims.join(', ');

        feed.textContent = data.named_project
            ? 'A project from your profile was identified.'
            : 'No project from your profile was identified.';

    } catch (error) {
        console.error('Error:', error.message);
        feed.textContent = error.message;
    }
}

async function replay_but() {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
        questionElement.textContent
    );

    speech.lang = 'en-IN';
    speech.rate = 0.95;

    window.speechSynthesis.speak(speech);
}

button.addEventListener('click', send_que_ans);
rep_but.addEventListener('click', replay_but);
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;

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
            micButton.textContent = "⏹ Stop Recording";
        };

        mediaRecorder.ondataavailable = (event) => {
            console.log("Audio chunk size:", event.data.size);

            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error("Recorder error:", event.error);
        };

        mediaRecorder.onstop = () => {
            console.log("Recording stopped. Chunks:", audioChunks.length);

            const blob = new Blob(audioChunks, {
                type: mediaRecorder.mimeType
            });

            console.log("Audio size:", blob.size, "bytes");

            recordedAudio.src = URL.createObjectURL(blob);
            recordedAudio.load();

            audioStream.getTracks().forEach(track => track.stop());

            micButton.textContent = "🎤 Start Recording";
            micStatus.textContent = "Recording stopped.";
        };

        mediaRecorder.start();

    } catch (error) {
        console.error("Microphone error:", error);
        micStatus.textContent = error.message;
    }
};loadQuestion();
