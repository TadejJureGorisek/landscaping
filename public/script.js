const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");

menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.classList.remove("error");
  statusEl.textContent = "Pošiljanje...";
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  try {
    const response = await fetch("/api/povprasevanje", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Napaka pri pošiljanju.");
    statusEl.textContent = result.message;
    form.reset();
  } catch (error) {
    statusEl.classList.add("error");
    statusEl.textContent = error.message || "Prišlo je do napake. Poskusite znova.";
  }
});

// ── Before / After Sliders ────────────────────────────────────────────────────
// Uses clip-path so both images are full-size and stationary.
// The handle only controls how much of the "before" layer is revealed.

document.querySelectorAll("[data-slider]").forEach((slider) => {
  const before = slider.querySelector(".ba-before");
  const handle = slider.querySelector(".ba-handle");

  // Set initial position
  before.style.clipPath = "inset(0 50% 0 0)";
  handle.style.left = "50%";

  let dragging = false;

  function setPosition(clientX) {
    const rect = slider.getBoundingClientRect();
    let pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = pct + "%";
  }

  slider.addEventListener("mousedown", (e) => { dragging = true; setPosition(e.clientX); e.preventDefault(); });
  window.addEventListener("mousemove", (e) => { if (dragging) setPosition(e.clientX); });
  window.addEventListener("mouseup", () => { dragging = false; });
  slider.addEventListener("touchstart", (e) => { dragging = true; setPosition(e.touches[0].clientX); }, { passive: true });
  window.addEventListener("touchmove", (e) => { if (dragging) setPosition(e.touches[0].clientX); }, { passive: true });
  window.addEventListener("touchend", () => { dragging = false; });
});
