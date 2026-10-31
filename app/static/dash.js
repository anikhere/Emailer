
(() => {
  const STUDENT_ID_KEY = "student_id";
  const DESTINATION_KEY = "internbridge.intendedDestination";

  const dialog = document.getElementById("onboarding-dialog");
  const form = document.getElementById("profile-form");
  const status = document.getElementById("form-status");
  const fullNameField = document.getElementById("full-name");
  const fileInput = document.getElementById("resume-file");
  const fileName = document.getElementById("resume-file-name");
  const navigation = document.getElementById("primary-navigation");
  const menuToggle = document.querySelector(".mobile-nav-toggle");
  const uploadButton = document.getElementById("upload-resume-button");
  const resumeStatus = document.getElementById("resume_status");
  const resumeText = document.getElementById("resume-text");

  let returnFocusTarget = null;

  function getStudentId() {
    try {
      return sessionStorage.getItem(STUDENT_ID_KEY);
    } catch {
      return null;
    }
  }

  function closeMobileNavigation() {
    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }

  function openOnboarding(trigger) {
    const navigationWasOpen = navigation.classList.contains("is-open");

    returnFocusTarget = navigationWasOpen
      ? menuToggle
      : trigger || document.activeElement;

    if (navigationWasOpen) closeMobileNavigation();

    status.hidden = true;
    status.textContent = "";

    if (!dialog.open) dialog.showModal();

    window.requestAnimationFrame(() =>
      fullNameField.focus({ preventScroll: true })
    );
  }

  function closeOnboarding() {
    if (dialog.open) dialog.close();
  }

  // Service links
  document.querySelectorAll("[data-service-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const destination =
        link.dataset.destination || link.getAttribute("href");

      try {
        sessionStorage.setItem(DESTINATION_KEY, destination);
      } catch (error) {
        // Continue if session storage is unavailable.
      }

      if (!getStudentId()) {
        event.preventDefault();
        openOnboarding(link);
      }
    });
  });


  document.querySelectorAll("[data-profile-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openOnboarding(trigger);
    });
  });

  
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", closeOnboarding);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeOnboarding();
  });

  dialog.addEventListener("close", () => {
    if (returnFocusTarget?.focus) returnFocusTarget.focus();
  });

  
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation"
    );
    navigation.classList.toggle("is-open", !isOpen);
  });

  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    link.addEventListener("click", () => {
      const wasOpen = navigation.classList.contains("is-open");
      closeMobileNavigation();
      if (wasOpen) menuToggle.focus();
    });
  });

  
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    fileName.textContent = file ? file.name : "Choose a PDF";

    if (!file) {
      resumeStatus.textContent = "No file selected.";
      return;
    }

    if (file.type !== "application/pdf") {
      resumeStatus.textContent = "Please select a PDF file.";
      fileInput.value = "";
      fileName.textContent = "Choose a PDF";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      resumeStatus.textContent = "PDF must be 5 MB or smaller.";
      fileInput.value = "";
      fileName.textContent = "Choose a PDF";
      return;
    }

    resumeStatus.textContent = "PDF selected. Ready to upload.";
  });

  uploadButton.addEventListener("click", async () => {
    const file = fileInput.files[0];

    if (!file) {
      resumeStatus.textContent = "Please select a PDF first.";
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    uploadButton.disabled = true;
    resumeStatus.textContent = "Extracting your resume text...";

    try {
      const response = await fetch("/api/student/pdf", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Resume upload failed.");
      }

      resumeText.value = result.resume;
      resumeStatus.textContent =
        "Text extracted successfully. Review it before continuing.";
    } catch (error) {
      resumeStatus.textContent =
        error.message || "Something went wrong.";
    } finally {
      uploadButton.disabled = false;
    }
  });


  async function submit_click(event) {
    event.preventDefault();

    status.hidden = false;
    status.textContent = "Creating profile...";

    try {
      const data = {
        name: document.getElementById("full-name").value.trim(),
        email: document.getElementById("email-address").value.trim(),
        phone:
          document.getElementById("phone-number").value.trim() || null,
        linkedin_url:
          document.getElementById("linkedin-url").value.trim() || null,
        github_url:
          document.getElementById("github-url").value.trim() || null,
        resume_text: resumeText.value.trim()
      };

      if (!data.resume_text) {
        throw new Error("Please upload a PDF or paste your resume text.");
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Profile creation failed.");
      }

      sessionStorage.setItem(STUDENT_ID_KEY, String(result.id));

      status.textContent = `Profile saved! `;

      const destination = sessionStorage.getItem(DESTINATION_KEY);

      if (destination) {
        sessionStorage.removeItem(DESTINATION_KEY);
        window.location.href = destination;
      } else {
        closeOnboarding();
      }
    } catch (error) {
      status.textContent = error.message || "Something went wrong.";
      status.hidden = false;
    }
  }

  form.addEventListener("submit", submit_click);
})();
