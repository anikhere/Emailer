const form = document.querySelector("#student-form");
const button = document.querySelector("#submit-button");
const statusMessage = document.querySelector("#status-message");

function optionalValue(elementId) {
    const value = document.querySelector(elementId).value.trim();

    return value || null;
}

form.addEventListener("submit", async function (event) {
    // Prevent the browser from reloading the page
    event.preventDefault();

    const studentData = {
        name: document.querySelector("#name").value.trim(),
        email: document.querySelector("#email").value.trim(),
        phone: optionalValue("#phone"),
        linkedin_url: optionalValue("#linkedin"),
        github_url: optionalValue("#github"),
        resume_text: document.querySelector("#resume").value.trim()
    };

    button.disabled = true;
    statusMessage.textContent = "Saving profile...";
    statusMessage.className = "";

    try {
        const response = await fetch("/api/students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

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
                responseData
            )
        }

        sessionStorage.setItem(
            'student_id',
            String(responseData.id)
        )
        statusMessage.textContent =
            `Profile created. Student ID: ${responseData.id}`;
                statusMessage.className = "success";
    } catch (error) {
        statusMessage.textContent = error.message;
        statusMessage.className = "error";
    } finally {
        button.disabled = false;
    }
});
