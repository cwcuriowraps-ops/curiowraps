document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("curioLogo");
  if (!logo) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion) {
    logo.style.opacity = "0";
    logo.style.transform = "scale(0.985)";
    logo.style.transition = "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)";

    requestAnimationFrame(() => {
      logo.style.opacity = "1";
      logo.style.transform = "scale(1)";
    });
  }
});
