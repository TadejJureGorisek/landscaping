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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Napaka pri pošiljanju.");
    }

    statusEl.textContent = result.message;
    form.reset();
  } catch (error) {
    statusEl.classList.add("error");
    statusEl.textContent = error.message || "Prišlo je do napake. Poskusite znova.";
  }
});
