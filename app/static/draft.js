const applicationId = sessionStorage.getItem(
    "application_id"
);

const recipientEmail = sessionStorage.getItem(
    "recipient_email"
);

const generateButton = document.querySelector(
    "#regenerate-button"
);

const saveButton = document.querySelector(
    "#save-open-button"
);

const subjectInput = document.querySelector(
    "#draft-subject"
);

const bodyInput = document.querySelector(
    "#draft-body"
);

const recipientInput = document.querySelector(
    "#recipient-email"
);

const statusMessage = document.querySelector(
    "#status-message"
);


if (!applicationId) {
    window.location.replace("/");
} else {
    recipientInput.value = recipientEmail || "";
    saveButton.disabled = true;

    generateButton.addEventListener(
        "click",
        generateDraft
    );
}


async function generateDraft() {
    generateButton.disabled = true;
    saveButton.disabled = true;

    statusMessage.textContent =
        "Generating your draft...";

    statusMessage.className = "";

    try {
        const response = await fetch(
            `/api/applications/${applicationId}/generate-draft`,
            {
                method: "POST"
            }
        );

        const responseText = await response.text();

        let responseData;

        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = {
                detail: responseText
            };
        }

        if (!response.ok) {
            throw new Error(
                responseData.detail ||
                "Draft generation failed"
            );
        }

        subjectInput.value = responseData.subject;
        bodyInput.value = responseData.body;

        statusMessage.textContent =
            "Draft generated. Review it before continuing.";

        statusMessage.className = "success";

        generateButton.textContent =
            "Regenerate draft";

        saveButton.disabled = false;
    } catch (error) {
        console.log("DRAFT ERROR:", error);
        console.log("ERROR MESSAGE:", error.message);

        statusMessage.textContent = error.message;
        statusMessage.className = "error";
    } finally {
        generateButton.disabled = false;
    }
}