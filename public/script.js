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

quoteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formNote.textContent = 'Hvala! Ta obrazec je za zdaj samo demo. Ko boste pripravljeni, ga povežite z e-pošto ali bazo podatkov.';
  quoteForm.reset();
});
