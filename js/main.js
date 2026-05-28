/* ── NAVBAR: scroll border + active link ── */
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

function onScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 10);

  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navAnchors.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ── MOBILE NAV ── */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('nav-mobile');

hamburger.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
});

mobileNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

/* ── SCROLL REVEAL (IntersectionObserver) ── */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    // stagger siblings within same parent
    const siblings = Array.from(el.parentElement.querySelectorAll('.reveal:not(.visible)'));
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = idx >= 0 ? `${idx * 100}ms` : '0ms';

    el.classList.add('visible');
    observer.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => observer.observe(el));

/* ── TYPING EFFECT ── */
const strings = [
  'Étudiant BTS SIO — SISR',
  'Réseaux & Cybersécurité',
  'Administration Système'
];
const typingEl = document.getElementById('typing-text');
let strIdx = 0, charIdx = 0, deleting = false;

function typeStep() {
  const current = strings[strIdx];
  if (!deleting) {
    typingEl.textContent = current.slice(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) {
      deleting = true;
      setTimeout(typeStep, 1800);
      return;
    }
    setTimeout(typeStep, 60);
  } else {
    typingEl.textContent = current.slice(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      deleting = false;
      strIdx = (strIdx + 1) % strings.length;
      setTimeout(typeStep, 400);
      return;
    }
    setTimeout(typeStep, 35);
  }
}
typeStep();

/* ── CONTACT FORM (Formspree async) ── */
const form = document.getElementById('contact-form');
const successMsg = document.getElementById('form-success');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Envoi...';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      form.style.display = 'none';
      successMsg.style.display = 'block';
    } else {
      btn.disabled = false;
      btn.textContent = 'Envoyer';
      alert('Une erreur est survenue. Réessaie plus tard.');
    }
  } catch {
    btn.disabled = false;
    btn.textContent = 'Envoyer';
    alert('Une erreur réseau est survenue.');
  }
});
