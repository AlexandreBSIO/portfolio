/* Fallback no-JS : le CSS cache .reveal par défaut, on le réactive ici */
document.documentElement.classList.add('js-enabled');

/* ── EMAIL OBFUSCATION ── */
/* Assemblé en JS pour ne pas exposer l'adresse aux bots de spam dans le HTML */
(function () {
  const u = 'alexandre.boulou.sio';
  const d = 'gmail.com';
  const email = u + '@' + d;
  const link = document.getElementById('email-link');
  const display = document.getElementById('email-display');
  if (link) link.href = 'mailto:' + email;
  if (display) display.textContent = email;
})();

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
  'Étudiant BTS SIO - SISR',
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

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  typingEl.textContent = strings[0];
} else {
  typeStep();
}

/* ── CONTACT FORM (Formspree async) ── */
const form = document.getElementById('contact-form');
const successMsg = document.getElementById('form-success');
const errorBox = document.getElementById('form-error');

const FIELD_LABELS = { nom: 'Nom', email: 'Email', message: 'Message' };

function clearErrors() {
  errorBox.classList.remove('visible');
  errorBox.innerHTML = '';
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function showError(title, items, fields = []) {
  errorBox.innerHTML = '';
  const strong = document.createElement('strong');
  strong.textContent = title;
  errorBox.appendChild(strong);
  if (items && items.length) {
    const ul = document.createElement('ul');
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
    errorBox.appendChild(ul);
  }
  errorBox.classList.add('visible');
  fields.forEach(f => {
    const el = form.querySelector(`[name="${f}"]`);
    if (el) el.classList.add('input-error');
  });
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validateClient() {
  const nom = form['_nom'].value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  const errors = [];
  const fields = [];

  if (!nom)        { errors.push('Le nom est obligatoire.');     fields.push('_nom'); }
  if (!email)      { errors.push('L’email est obligatoire.'); fields.push('email'); }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Le format de l’email est invalide (ex : nom@domaine.fr).');
    fields.push('email');
  }
  if (!message)         { errors.push('Le message est obligatoire.'); fields.push('message'); }
  else if (message.length < 10) {
    errors.push('Le message doit faire au moins 10 caractères.');
    fields.push('message');
  }
  return { errors, fields };
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const { errors, fields } = validateClient();
  if (errors.length) {
    showError('Merci de corriger les points suivants :', errors, fields);
    return;
  }

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
      return;
    }

    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }

    const fieldErrors = [];
    const fieldHighlights = [];

    if (data && Array.isArray(data.errors) && data.errors.length) {
      data.errors.forEach(err => {
        const fieldName = err.field;
        const label = FIELD_LABELS[fieldName] || fieldName;
        const msg = err.message || 'valeur invalide';
        fieldErrors.push(label ? `${label} : ${msg}` : msg);
        if (fieldName) fieldHighlights.push(fieldName);
      });
      showError('Formulaire refusé par le serveur :', fieldErrors, fieldHighlights);
    } else if (res.status === 403) {
      showError('Le formulaire n’est pas encore activé.', [
        'L’administrateur du site doit confirmer son adresse Formspree avant de pouvoir recevoir des messages.'
      ]);
    } else if (res.status === 404) {
      showError('Destinataire introuvable.', [
        'L’identifiant du formulaire est invalide ou a été supprimé.'
      ]);
    } else if (res.status === 422) {
      showError('Message bloqué.', [
        'Le filtre anti-spam a rejeté le message. Réessayez avec un contenu différent.'
      ]);
    } else if (res.status === 429) {
      showError('Trop de tentatives.', [
        'Vous avez envoyé trop de messages en peu de temps. Patientez quelques minutes avant de réessayer.'
      ]);
    } else if (res.status >= 500) {
      showError('Le serveur Formspree est indisponible.', [
        `Code d’erreur HTTP ${res.status}. Réessayez dans quelques minutes.`
      ]);
    } else {
      showError(`Erreur HTTP ${res.status}.`, [
        data && data.error ? data.error : 'Réponse inattendue du serveur.'
      ]);
    }
  } catch (err) {
    showError('Impossible de joindre le serveur.', [
      'Vérifiez votre connexion internet, puis réessayez.',
      `Détail technique : ${err.message || err}`
    ]);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Envoyer';
  }
});

['_nom', 'email', 'message'].forEach(name => {
  const el = form.querySelector(`[name="${name}"]`);
  if (el) el.addEventListener('input', () => el.classList.remove('input-error'));
});
