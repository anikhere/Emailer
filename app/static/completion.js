(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const transitionLinks = document.querySelectorAll("[data-page-transition]");

  transitionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      // Keep normal browser behavior for modified clicks, new tabs, and reduced-motion users.
      if (
        prefersReducedMotion.matches ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank"
      ) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      event.preventDefault();
      document.documentElement.classList.add("is-leaving");
      window.setTimeout(() => window.location.assign(destination.href), 180);
    });
  });
})();
