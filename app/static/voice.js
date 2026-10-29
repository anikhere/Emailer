
const speakBtn = document.getElementById("speak-btn");
const transcriptBox = document.getElementById("transcript");
const voiceStatus = document.getElementById("voice-status");

let recorder;
let stream;
let audioChunks = [];
let processing = false;

speakBtn.addEventListener("click", async () => {
    if (recorder && recorder.state === "recording") {
        recorder.stop();
        speakBtn.textContent = "🎙 Speak";
        voiceStatus.textContent = "Processing audio...";
        return;
    }

    if (processing) return;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const currentStream = stream;
        audioChunks = [];

        const currentRecorder = new MediaRecorder(currentStream);
        recorder = currentRecorder;

        currentRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        currentRecorder.onstop = async () => {
            processing = true;

            try {
                const audioBlob = new Blob(audioChunks, {
                    type: currentRecorder.mimeType || "audio/webm"
                });

                const formData = new FormData();
                formData.append("file", audioBlob, "recording.webm");

                const response = await fetch("/api/stt_", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Transcription failed.");
                }

                transcriptBox.value = data.transcript;
                voiceStatus.textContent = "Transcription complete!";

            } catch (error) {
                console.error("Transcription error:", error);
                voiceStatus.textContent = error.message;

            } finally {
                currentStream.getTracks().forEach(track => track.stop());
                processing = false;
                speakBtn.textContent = "🎙 Speak";
            }
        };

        currentRecorder.start();
        speakBtn.textContent = "⏹ Stop Recording";
        voiceStatus.textContent = "Recording... Click again to stop.";

    } catch (error) {
        console.error("Microphone error:", error);
        voiceStatus.textContent = "Microphone error: " + error.message;

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
});
