const student_id = sessionStorage.getItem("student_id");

if (!student_id) {
    window.location.href = "/";
}

document.querySelector("#student-information").textContent =
    `Creating an application for Student #${student_id}`;

const applicationForm = document.querySelector("#application-form");
const applicationButton = document.querySelector("#application-button");
const applicationStatus = document.querySelector("#application-status");

applicationForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const applicationData = {
        company_name: document.querySelector("#company-name").value.trim(),
        job_role: document.querySelector("#job-role").value.trim(),
        recipient_name: document.querySelector("#recipient-name").value.trim() || null,
        recipient_email: document.querySelector("#recipient-email").value.trim(),
        job_description: document.querySelector("#job-description").value.trim()
    };

    applicationButton.disabled = true;
    applicationStatus.textContent = "Creating application...";

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
        console.log("Backend response:", responseData);
        console.log("Returned ID:", responseData.id);

        if (!response.ok) {
            throw new Error(
                responseData.detail || "Could not create application"
            );
        }

        sessionStorage.setItem(
            "application_id",
            String(responseData.id)
        );
        console.log(sessionStorage.getItem('application_id'))

        sessionStorage.setItem(
            "recipient_email",
            applicationData.recipient_email
        );
        console.log(sessionStorage.getItem('recipient_email'))
        window.location.href = "/draft";

    } catch (error) {

        applicationStatus.textContent = error.message;
        applicationStatus.className = "error";

    } finally {

        applicationButton.disabled = false;
    }
});