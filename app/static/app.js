
const student_id = sessionStorage.getItem("student_id");


if (!student_id) {
    window.location.href = "/dash";
}

document.querySelector("#student-information").textContent =
    "Your next opportunity starts here";

const applicationForm = document.querySelector("#application-form");
const applicationButton = document.querySelector("#application-button");
const applicationStatus = document.querySelector("#application-status");

applicationForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const emailInstructions =
        document.querySelector("#transcript").value.trim();

    const applicationData = {
        company_name: document.querySelector("#company-name").value.trim(),
        job_role: document.querySelector("#job-role").value.trim(),
        recipient_email: document.querySelector("#recipient-email").value.trim(),
        instructions:emailInstructions|| '',
        
    };

    applicationButton.disabled = true;
    applicationStatus.textContent = "Creating application...";
    applicationStatus.className = "";

    try {
        const response = await fetch(
            `/api/students/${student_id}/applications`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(applicationData)
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(
                responseData.detail || "Could not create application"
            );
        }

        if (typeof track === "function") {
            track("applicant_submitted");
        }

        sessionStorage.setItem(
            "application_id",
            String(responseData.id)
        );

        sessionStorage.setItem(
            "recipient_email",
            applicationData.recipient_email
        );
        sessionStorage.setItem('email_prompt',emailInstructions)
        sessionStorage.setItem(
            "company_name",
            applicationData.company_name
        );

        sessionStorage.setItem(
            "job_role",
            applicationData.job_role
        );



        window.location.href = "/draft";

    } catch (error) {
        applicationStatus.textContent = error.message;
        applicationStatus.className = "error";
    } finally {
        applicationButton.disabled = false;
    }
});
