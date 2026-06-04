const express = require("express");
const path = require("path");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/povprasevanje", async (req, res) => {
  try {
    const { kontakt, lokacija, potniStroski, nacin, storitve, skupaj } = req.body;

    if (!kontakt) {
      return res.status(400).json({ success: false, message: "Prosimo, vnesite kontaktne podatke." });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return res.status(500).json({ success: false, message: "Strežnik ni pravilno nastavljen." });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build HTML email body from calculator data
    let storitveHtml = "";
    if (Array.isArray(storitve)) {
      storitveHtml = storitve.map(s =>
        `<tr>
          <td style="padding:4px 8px">${escapeHtml(s.naziv)}</td>
          <td style="padding:4px 8px;color:#666">${escapeHtml(s.podrobnosti)}</td>
          <td style="padding:4px 8px;text-align:right;font-weight:bold">${escapeHtml(s.cena)}</td>
        </tr>`
      ).join("");
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px">
        <h2 style="color:#1a3a1f">Novo povpraševanje — Icarus okolica</h2>
        <p><strong>Kontakt:</strong> ${escapeHtml(kontakt)}</p>
        <p><strong>Lokacija:</strong> ${escapeHtml(lokacija || "Ni navedeno")}</p>
        <p><strong>Način:</strong> ${escapeHtml(nacin || "—")}</p>
        <hr style="border:1px solid #eee"/>
        <h3 style="color:#1a3a1f">Izbrane storitve</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f0f7f0">
              <th style="padding:6px 8px;text-align:left">Storitev</th>
              <th style="padding:6px 8px;text-align:left">Podrobnosti</th>
              <th style="padding:6px 8px;text-align:right">Cena</th>
            </tr>
          </thead>
          <tbody>${storitveHtml}</tbody>
        </table>
        <hr style="border:1px solid #eee"/>
        ${potniStroski ? `<p><strong>Potni stroški:</strong> ${escapeHtml(String(potniStroski))} €</p>` : ""}
        <p style="font-size:18px"><strong>Skupaj ocena: ${escapeHtml(String(skupaj || "—"))} €</strong></p>
        <p style="font-size:12px;color:#999">Cene so okvirne brez DDV. Točna cena po ogledu na terenu.</p>
      </div>
    `;

    // Unique subject per inquiry so each lands as a separate email thread
    const timestamp = new Date().toLocaleString("sl-SI", { timeZone: "Europe/Ljubljana", hour12: false });
    const subject = `Novo povpraševanje — ${escapeHtml(kontakt)} (${timestamp})`;

    await resend.emails.send({
      from: "Icarus okolica <onboarding@resend.dev>",
      to: process.env.TO_EMAIL || "icarus.okolica@gmail.com",
      subject,
      html,
      reply_to: kontakt.includes("@") ? kontakt : undefined,
      headers: {
        // Unique Message-ID prevents Gmail/Outlook from threading emails together
        "X-Entity-Ref-ID": `povprasevanje-${Date.now()}-${Math.random().toString(36).slice(2)}`
      }
    });

    res.json({ success: true, message: "Hvala! Javili se vam bomo v kratkem." });
  } catch (error) {
    console.error("Resend error:", error);
    res.status(500).json({ success: false, message: "Pri pošiljanju je prišlo do napake. Poskusite znova." });
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
  console.log(`Icarus okolica running on port ${PORT}`);
});
