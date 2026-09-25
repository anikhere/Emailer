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
saveButton.addEventListener(
    "click",
    saveAndOpenGmail
);


async function saveAndOpenGmail() {
    const recipient = recipientInput.value.trim();
    const subject = subjectInput.value.trim();
    const body = bodyInput.value.trim();

    if (!recipient || !subject || !body) {
        statusMessage.textContent =
            "Recipient, subject and body are required.";

        statusMessage.className = "error";
        return;
    }

    const gmailWindow = window.open(
        "about:blank",
        "_blank"
    );

    saveButton.disabled = true;

    statusMessage.textContent =
        "Saving your final draft...";

    statusMessage.className = "";

    try {
        const response = await fetch(
            `/api/applications/${applicationId}/draft`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    subject: subject,
                    body: body
                })
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
                "Could not save the final draft"
            );
        }

        const gmailUrl = new URL(
            "https://mail.google.com/mail/"
        );

        gmailUrl.searchParams.set("view", "cm");
        gmailUrl.searchParams.set("fs", "1");
        gmailUrl.searchParams.set("to", recipient);

        gmailUrl.searchParams.set(
            "su",
            responseData.final_subject
        );

        gmailUrl.searchParams.set(
            "body",
            responseData.final_body
        );

        if (gmailWindow) {
            gmailWindow.location.href =
                gmailUrl.toString();
        }

        statusMessage.textContent =
            "Draft saved. Gmail has been opened.";

        statusMessage.className = "success";
    } catch (error) {
        if (gmailWindow) {
            gmailWindow.close();
        }

        statusMessage.textContent = error.message;
        statusMessage.className = "error";
    } finally {
        saveButton.disabled = false;
    }
}