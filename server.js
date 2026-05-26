const express = require("express");
const path = require("path");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/povprasevanje", async (req, res) => {
  try {
    const { ime, kontakt, storitev, lokacija, sporocilo } = req.body;

    if (!ime || !kontakt || !storitev || !sporocilo) {
      return res.status(400).json({
        success: false,
        message: "Prosimo, izpolnite vsa obvezna polja."
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return res.status(500).json({
        success: false,
        message: "Strežnik ni pravilno nastavljen."
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Novo povpraševanje - Icarus Landscaping</h2>
        <p><strong>Ime:</strong> ${escapeHtml(ime)}</p>
        <p><strong>Kontakt:</strong> ${escapeHtml(kontakt)}</p>
        <p><strong>Storitev:</strong> ${escapeHtml(storitev)}</p>
        <p><strong>Lokacija:</strong> ${escapeHtml(lokacija || "Ni navedeno")}</p>
        <p><strong>Sporočilo:</strong></p>
        <p>${escapeHtml(sporocilo).replace(/\n/g, "<br>")}</p>
      </div>
    `;

    await resend.emails.send({
      from: "Icarus Landscaping <onboarding@resend.dev>",
      to: "tadejjure.gorisek@gmail.com",
      subject: "POVPRAŠEVANJE",
      html,
      reply_to: kontakt.includes("@") ? kontakt : undefined
    });

    res.json({
      success: true,
      message: "Hvala! Vaše povpraševanje je bilo poslano."
    });
  } catch (error) {
    console.error("Resend error:", error);
    res.status(500).json({
      success: false,
      message: "Pri pošiljanju je prišlo do napake. Poskusite znova."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

app.listen(PORT, () => {
  console.log(`Icarus Landscaping running on port ${PORT}`);
});
