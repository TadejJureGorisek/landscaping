import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const TO_EMAIL = "tadejjure.gorisek@gmail.com";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

function clean(value = "") {
  return String(value).trim().slice(0, 2000);
}

app.post("/api/contact", async (req, res) => {
  try {
    const name = clean(req.body.name);
    const contact = clean(req.body.contact);
    const service = clean(req.body.service);
    const message = clean(req.body.message);

    if (!name || !contact || !service) {
      return res.status(400).json({
        ok: false,
        message: "Prosimo, izpolnite ime, kontakt in izbrano storitev."
      });
    }

    const transporter = createTransporter();

    if (!transporter) {
      console.error("Missing SMTP environment variables. Email was not sent.");
      return res.status(500).json({
        ok: false,
        message: "Pošiljanje e-pošte še ni nastavljeno. Preverite SMTP nastavitve."
      });
    }

    const emailBody = `Novo povpraševanje s spletne strani Icarus Landscaping\n\nIme: ${name}\nKontakt: ${contact}\nStoritev: ${service}\n\nSporočilo:\n${message || "Ni sporočila."}`;

    await transporter.sendMail({
      from: `Icarus Landscaping <${process.env.SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: contact.includes("@") ? contact : undefined,
      subject: "POVPRAŠEVANJE",
      text: emailBody
    });

    res.json({
      ok: true,
      message: "Hvala! Vaše povpraševanje je bilo uspešno poslano."
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      ok: false,
      message: "Prišlo je do napake pri pošiljanju. Poskusite znova kasneje."
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Website is running",
    timestamp: new Date().toISOString()
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
