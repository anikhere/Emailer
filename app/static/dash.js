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
    
      let returnFocusTarget = null;

      function getStudentId() {
        try {
          return window.sessionStorage.getItem(STUDENT_ID_KEY);
        } catch (error) {
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
        returnFocusTarget = navigationWasOpen ? menuToggle : (trigger || document.activeElement);
        if (navigationWasOpen) closeMobileNavigation();

        status.hidden = true;
        status.textContent = "";
        if (!dialog.open) dialog.showModal();
        window.requestAnimationFrame(() => fullNameField.focus({ preventScroll: true }));
      }

      function closeOnboarding() {
        if (dialog.open) dialog.close();
      }

      document.querySelectorAll("[data-service-link]").forEach((serviceLink) => {
        serviceLink.addEventListener("click", (event) => {
          const destination = serviceLink.dataset.destination || serviceLink.getAttribute("href");
          try {
            window.sessionStorage.setItem(DESTINATION_KEY, destination);
          } catch (error) {
            // The destination remains on the link if session storage is unavailable.
          }

          // A returning student follows the service link directly. New visitors see onboarding.
          if (!getStudentId()) {
            event.preventDefault();
            openOnboarding(serviceLink);
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
        if (returnFocusTarget && typeof returnFocusTarget.focus === "function") {
          returnFocusTarget.focus();
        }
      });

      menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
        navigation.classList.toggle("is-open", !isOpen);
      });

      document.querySelectorAll("[data-nav-link]").forEach((link) => {
        link.addEventListener("click", () => {
          const navigationWasOpen = navigation.classList.contains("is-open");
          closeMobileNavigation();
          if (navigationWasOpen) menuToggle.focus();
        });
      });

      fileInput.addEventListener("change", () => {
        fileName.textContent = fileInput.files && fileInput.files.length
          ? fileInput.files[0].name
          : "Choose a file";
      });

async function submit_click(event) {
  event.preventDefault();
  status.hidden = false;
  status.textContent = "Creating profile...";
  try {
    const data = {
      name: document.getElementById("full-name").value.trim(),
      email: document.getElementById("email-address").value.trim(),
      phone: document.getElementById("phone-number").value.trim() || null,
      linkedin_url: document.getElementById("linkedin-url").value.trim() || null,
      github_url: document.getElementById("github-url").value.trim() || null,
      resume_text: document.getElementById("resume-text").value.trim()
    };

    if (!data.resume_text) {
      throw new Error("Please paste your resume text.");
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

    status.textContent = `Profile saved! Student ID: ${result.id}`;
    status.hidden = false;

    const destination = sessionStorage.getItem(DESTINATION_KEY);

    if (destination) {
      sessionStorage.removeItem(DESTINATION_KEY);
      window.location.href = destination;
    } else {
      closeOnboarding();
    }

  } catch (error) {
    status.textContent = error.message || 'something went wrong';
    status.hidden = false;
  }
}

form.addEventListener("submit", submit_click);
    })();
    
