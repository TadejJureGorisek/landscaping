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
    const timestamp = new Date().toLocaleString("sl-SI", { timeZone: "Europe/Ljubljana", hour12: false });

    // Build services rows
    let storitveRows = "";
    if (Array.isArray(storitve)) {
      storitveRows = storitve.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#f9fdf9' : '#ffffff'}">
          <td style="padding:10px 16px;font-size:14px;color:#1a3a1f;border-bottom:1px solid #e8f5e9">${escapeHtml(s.naziv)}</td>
          <td style="padding:10px 16px;font-size:13px;color:#5a7a5a;border-bottom:1px solid #e8f5e9">${escapeHtml(s.podrobnosti)}</td>
          <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#248a4d;text-align:right;border-bottom:1px solid #e8f5e9;white-space:nowrap">${escapeHtml(s.cena)}</td>
        </tr>`).join("");
    }

    // Reply button if email provided
    const replyBtn = kontakt.includes("@")
      ? `<a href="mailto:${escapeHtml(kontakt)}?subject=Re: Povpraševanje Icarus okolica"
           style="display:inline-block;background:#248a4d;color:#ffffff;text-decoration:none;
                  font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;margin-top:4px;">
           Odgovori stranki →
         </a>`
      : `<a href="tel:${escapeHtml(kontakt)}"
           style="display:inline-block;background:#248a4d;color:#ffffff;text-decoration:none;
                  font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;margin-top:4px;">
           Pokliči stranko →
         </a>`;

    const html = `
<!DOCTYPE html>
<html lang="sl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1a3a1f;border-radius:14px 14px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#4caf50;">Icarus okolica</p>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">Novo povpraševanje</h1>
            <p style="margin:8px 0 0;font-size:13px;color:#8fbc8f;">${escapeHtml(timestamp)}</p>
          </td>
        </tr>

        <!-- Contact info -->
        <tr>
          <td style="background:#ffffff;padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;padding:0 8px 0 0;vertical-align:top;">
                  <div style="background:#f9fdf9;border:1px solid #e0f0e0;border-radius:10px;padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8fbc8f;">Kontakt stranke</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">${escapeHtml(kontakt)}</p>
                  </div>
                </td>
                <td style="width:50%;padding:0 0 0 8px;vertical-align:top;">
                  <div style="background:#f9fdf9;border:1px solid #e0f0e0;border-radius:10px;padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8fbc8f;">Lokacija</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">${escapeHtml(lokacija || "Ni navedeno")}</p>
                  </div>
                </td>
              </tr>
              <tr><td colspan="2" style="padding-top:12px;">
                <div style="background:#f9fdf9;border:1px solid #e0f0e0;border-radius:10px;padding:14px 16px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8fbc8f;">Vrsta storitve</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">${escapeHtml(nacin || "—")}</p>
                </div>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Services table -->
        <tr>
          <td style="background:#ffffff;padding:20px 32px 0;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8fbc8f;">Izbrane storitve</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0f0e0;border-radius:10px;overflow:hidden;font-size:14px;">
              <thead>
                <tr style="background:#1a3a1f;">
                  <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:700;color:#8fbc8f;letter-spacing:0.06em;text-transform:uppercase;">Storitev</th>
                  <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:700;color:#8fbc8f;letter-spacing:0.06em;text-transform:uppercase;">Podrobnosti</th>
                  <th style="padding:10px 16px;text-align:right;font-size:12px;font-weight:700;color:#8fbc8f;letter-spacing:0.06em;text-transform:uppercase;">Cena</th>
                </tr>
              </thead>
              <tbody>${storitveRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td style="background:#ffffff;padding:16px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${potniStroski ? `
              <tr>
                <td style="padding:8px 16px;font-size:13px;color:#5a7a5a;">🚗 Potni stroški</td>
                <td style="padding:8px 16px;font-size:13px;color:#5a7a5a;text-align:right;">${escapeHtml(String(potniStroski))} €</td>
              </tr>` : ""}
              <tr style="background:#1a3a1f;border-radius:10px;">
                <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#ffffff;border-radius:10px 0 0 10px;">Skupaj ocena</td>
                <td style="padding:14px 16px;font-size:22px;font-weight:800;color:#4caf50;text-align:right;border-radius:0 10px 10px 0;">${escapeHtml(String(skupaj || "—"))} €</td>
              </tr>
            </table>
            <p style="margin:8px 0 0;font-size:11px;color:#aaa;">Cene so okvirne brez DDV. Točna cena po ogledu na terenu.</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:24px 32px 28px;text-align:center;">
            ${replyBtn}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f2a14;border-radius:0 0 14px 14px;padding:18px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#4d7a52;">ICARUS STUDIO, Tadej Jure Gorišek s.p. · Sarajevska ulica 4, 2000 Maribor</p>
            <p style="margin:4px 0 0;font-size:11px;color:#3d6b4f;">MŠ: 9714472000 · DŠ: 42449545</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const subject = `Novo povpraševanje — ${kontakt} (${timestamp})`;

    await resend.emails.send({
      from: "Icarus okolica <onboarding@resend.dev>",
      to: process.env.TO_EMAIL || "icarus.okolica@gmail.com",
      subject,
      html,
      reply_to: kontakt.includes("@") ? kontakt : undefined,
      headers: {
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
