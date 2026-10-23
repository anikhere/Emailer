const answer = document.querySelector('#answer');
const button = document.querySelector('#submit-button');
const questionElement = document.querySelector('#question');
const rep_but = document.querySelector('#replay-button');
const feed = document.querySelector('#status-message');
const micButton = document.querySelector('#mic-button');
const micStatus = document.querySelector('#mic-status');
const trans_button = document.querySelector('#transcribe-button')
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


button.addEventListener('click', send_que_ans);
rep_but.onclick = async ()=>{
    try{
        const response = await fetch('/api/hear_question/',{
            method : 'POST',
            headers : {
                'content-type':'application/json'
            },
            body: JSON.stringify({
                question:questionElement.textContent.trim()
            })
        });
        if (!response.ok){
            throw new Error('could not generate the audio')
        }
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(error => console.error("Playback failed:", error));

    }catch (error) {
         console.error('audio error:',error)
         feed.textContent = error.message;
    }
}

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let recorded_blobb = null

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

            // CHANGED: Show the correct button text.
            micButton.textContent = "Stop Recording";

            // CHANGED: Add the recording class to the microphone button.
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

            // CHANGED: Remove the recording class after an error.
            micButton.classList.remove("recording");

            // CHANGED: Restore the original button text.
            micButton.textContent = "🎤 Start Recording";

            // CHANGED: Display a readable error message.
            micStatus.textContent =
                event.error?.message || "Recording failed. Please try again.";

            // CHANGED: Stop microphone tracks after an error.
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }
        };
        mediaRecorder.onstop = async () => {
            console.log("Recording stopped. Chunks:", audioChunks.length);

            // CHANGED: Remove the recording class when recording stops.
            micButton.classList.remove("recording");

            // CHANGED: Restore the original button text.
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
            console.log("Audio element:", recordedAudio);
            console.log("Audio source:", recordedAudio.src);
            console.log("Audio ready state:", recordedAudio.readyState);
            console.log("Audio error:", recordedAudio.error);
            recordedAudio.load();

            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }

            micStatus.textContent = "Recording stopped.";
            recorded_blobb = blob
        };

        mediaRecorder.start();

    } catch (error) {
        console.error("Microphone error:", error);

        // CHANGED: Clean up the recording class if setup fails.
        micButton.classList.remove("recording");

        // CHANGED: Restore the original button text.
        micButton.textContent = "🎤 Start Recording";

        // CHANGED: Show a readable error in the status element.
        micStatus.textContent =
            error.message || "Could not start recording. Please try again.";

        // CHANGED: Release the microphone if it was already opened.
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
    if (!recorded_blobb || recorded_blobb.size === 0){
        console.error('some error occured')
        micStatus.textContent = 'Please record a proper sound'
        return
    }
    await Bolbb_transcribe(recorded_blobb)
}