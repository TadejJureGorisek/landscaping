
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const status = document.getElementById('status');
  status.innerText = 'Pošiljanje...';

  const body = {
    name: document.getElementById('name').value,
    contact: document.getElementById('contact').value,
    service: document.getElementById('service').value,
    message: document.getElementById('message').value,
  };

  try {
    const res = await fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.success) {
      status.innerText = 'Povpraševanje uspešno poslano!';
    } else {
      status.innerText = 'Napaka pri pošiljanju.';
    }
  } catch (err) {
    status.innerText = 'Napaka povezave.';
  }
});
