
const answer = document.querySelector('#answer');
const button = document.querySelector('#submit-button');
const questionElement = document.querySelector('#question');
const rep_but = document.querySelector('#replay-button');
const feed = document.querySelector('#status-message');

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
        // CHANGED: Get the text typed by the user.
        const answerText = answer.value.trim();

        // CHANGED: Prevent empty answers from being submitted.
        if (!answerText) {
            throw new Error('Please enter your answer.');
        }

        const response = await fetch('/api/interview_answer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // CHANGED: Send the answer text, not the textarea element.
            body: JSON.stringify({
                question: questionElement.textContent,
                answer: answerText
            })
        });

        const data = await response.json();

        // CHANGED: Check the HTTP response status.
        if (!response.ok) {
            throw new Error(data.detail || 'Failed to submit answer.');
        }

        // Display the feedback returned by FastAPI.
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
loadQuestion();
