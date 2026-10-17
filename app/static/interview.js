console.log("JavaScript loaded");

console.log("SpeechRecognition:", 
    window.SpeechRecognition || window.webkitSpeechRecognition
);

console.log("Microphone button:", micButton);
const answer = document.querySelector('#answer');
const button = document.querySelector('#submit-button');
const questionElement = document.querySelector('#question');
const rep_but = document.querySelector('#replay-button');
const feed = document.querySelector('#status-message');
const micButton = document.querySelector('#mic-button');
const micStatus = document.querySelector('#mic-status');
console.log('Mic button:', micButton);
console.log('Mic status:', micStatus);
const evi = document.querySelector('#evidence');
const claim = document.querySelector('#unsupported-claims');
const tip = document.querySelector('#tip');


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
    )
    speech.lang = 'en-IN';
    speech.rate = 0.95;
    window.speechSynthesis.speak(speech)

}

button.addEventListener('click', send_que_ans);
rep_but.addEventListener('click',replay_but)
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

micButton.addEventListener('click', () => {
    console.log('Mic button clicked');

    if (!SpeechRecognition) {
        micStatus.textContent = 'Speech recognition is not supported.';
        return;
    }

    if (recognition) {
        recognition.stop();
        recognition = null;
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        console.log('Microphone started');
        micStatus.textContent = 'Listening... Speak now.';
        micButton.textContent = '⏹ Stop Recording';
    };

    recognition.onresult = (event) => {
        let transcript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' ';
        }

        answer.value = (answer.value + ' ' + transcript).trim();
    };

    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        micStatus.textContent = `Microphone error: ${event.error}`;
    };

    recognition.onend = () => {
        recognition = null;
        micButton.textContent = '🎤 Speak Your Answer';
        micStatus.textContent = 'Recording stopped.';
    };

    recognition.start();
});loadQuestion();
