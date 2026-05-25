const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const quoteForm = document.querySelector('#quoteForm');
const formNote = document.querySelector('#formNote');
const year = document.querySelector('#year');

year.textContent = new Date().getFullYear();

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

quoteForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = quoteForm.querySelector('button[type="submit"]');
  const formData = new FormData(quoteForm);
  const data = Object.fromEntries(formData.entries());

  submitButton.disabled = true;
  submitButton.textContent = 'Pošiljanje...';
  formNote.textContent = 'Pošiljamo vaše povpraševanje.';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'Pošiljanje ni uspelo.');
    }

    formNote.textContent = result.message;
    quoteForm.reset();
  } catch (error) {
    formNote.textContent = error.message || 'Prišlo je do napake. Poskusite znova.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Pošlji povpraševanje';
  }
});
