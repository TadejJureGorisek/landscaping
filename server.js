
const express = require('express');
const bodyParser = require('body-parser');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/contact', async (req, res) => {
  try {
    const { name, contact, service, message } = req.body;

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'tadejjure.gorisek@gmail.com',
      subject: 'POVPRAŠEVANJE',
      html: `
        <h2>Novo povpraševanje</h2>
        <p><strong>Ime:</strong> ${name}</p>
        <p><strong>Kontakt:</strong> ${contact}</p>
        <p><strong>Storitev:</strong> ${service}</p>
        <p><strong>Sporočilo:</strong><br>${message}</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
