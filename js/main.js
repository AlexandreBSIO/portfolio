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

/* Bordure du navbar au scroll */
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* Lien actif : observe la section qui croise le centre du viewport
   (un seul observateur, zéro lecture de layout au scroll) */
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)
    );
  });
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach(s => navObserver.observe(s));

/* ── MOBILE NAV ── */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('nav-mobile');

if (hamburger && mobileNav) {
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
}

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

if (typingEl) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typingEl.textContent = strings[0];
  } else {
    typeStep();
  }
}

/* ── CONTACT FORM (Formspree async) ── */
const form = document.getElementById('contact-form');
const successMsg = document.getElementById('form-success');
const errorBox = document.getElementById('form-error');

const FIELD_LABELS = { _nom: 'Nom', email: 'Email', message: 'Message' };

function clearErrors() {
  errorBox.classList.remove('visible');
  errorBox.textContent = '';
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function showError(title, items, fields = []) {
  errorBox.textContent = '';
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

if (form) form.addEventListener('submit', async (e) => {
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

if (form) ['_nom', 'email', 'message'].forEach(name => {
  const el = form.querySelector(`[name="${name}"]`);
  if (el) el.addEventListener('input', () => el.classList.remove('input-error'));
});

/* ── MODALS : fiches projet détaillées ── */
/* Contenu BROUILLON à corriger : déduit des infos existantes, à valider par Alexandre. */
const PROJECTS = {
  dokuverse: {
    eyebrow: 'Projet personnel · Idée & conception',
    title: 'DokuVerse',
    tags: ['React', 'JavaScript', 'Base de données', 'Web App', 'IA / Claude Code'],
    blocks: [
      { h: 'Contexte', p: "Projet personnel dont je suis à l'origine : une application web de notation et de suivi d'animes et de mangas, avec un système de tierlist personnalisable. L'idée, le concept et les fonctionnalités sont les miens." },
      { h: 'Ce que j’ai fait', items: [
        "Définition de l'idée, des fonctionnalités et de l'expérience visée",
        "Conception du système de notation, de suivi et de la tierlist",
        "Concrétisation de l'application en grande partie avec l'aide de Claude Code (assistant IA), que j'ai piloté et orienté",
        "Choix de la stack (React, base de données) et itérations sur le résultat"
      ] },
      { h: 'Outils & technologies', p: "React, JavaScript, HTML/CSS, base de données. Développement assisté par IA (Claude Code)." },
      { h: 'Ce que ça m’a appris', p: "Passer d'une idée à un produit fonctionnel en m'appuyant sur l'IA comme outil de développement : formuler des spécifications claires, structurer le projet, et itérer jusqu'au résultat voulu. Une vraie compétence aujourd'hui : savoir utiliser ces outils efficacement." }
    ]
  },
  cleanergy: {
    eyebrow: 'Projet · Infrastructure Active Directory',
    title: 'Cleanergy',
    tags: ['Windows Server 2022', 'Active Directory', 'Proxmox', 'GPO / AGDLP', 'Kerberos', 'SSSD', 'DNSSEC'],
    blocks: [
      { h: 'Contexte', p: "Mise en place d'une infrastructure réseau et Active Directory complète pour Cleanergy, une entreprise fictive. Objectif : déployer un domaine, centraliser la gestion des utilisateurs et des postes, et intégrer des machines Linux au domaine." },
      { h: 'Ce que j’ai fait', items: [
        "Déploiement d'un contrôleur de domaine Windows Server 2022 sous Proxmox",
        "Configuration du DNS et signature DNSSEC de la zone",
        "Structure d'OU et gestion des droits selon le modèle AGDLP",
        "Mise en place de GPO (sécurité, profils itinérants, restrictions postes)",
        "Jonction de machines Linux au domaine via Kerberos / SSSD pour une authentification centralisée"
      ] },
      { h: 'Outils & technologies', p: "Windows Server 2022, Active Directory, Proxmox, GPO/AGDLP, Kerberos, SSSD, DNSSEC." },
      { h: 'Ce que ça m’a appris', p: "La logique d'un annuaire centralisé et l'importance d'une structure d'OU et de droits propre dès le départ. L'intégration Linux/AD m'a fait comprendre le fonctionnement de Kerberos en pratique." }
    ]
  },
  mgc: {
    eyebrow: 'Stage · Administrateur Systèmes & Réseaux',
    title: 'MGC',
    tags: ['PingCastle', 'Active Directory', 'Kerberos AES-256', 'NTLM', 'VLAN', 'iPerf', 'Wazuh', 'Sophos', 'CVE', 'Audit sécurité'],
    blocks: [
      { h: 'Contexte', p: "Stage d'administrateur systèmes & réseaux chez MGC. Mission centrée sur l'audit et le durcissement de l'Active Directory existant, l'analyse de postes utilisateurs dans un scénario post-phishing, et des interventions réseau. (Stage en cours.)" },
      { h: "Ce que j'ai fait", items: [
        "Audit de sécurité de l'AD avec PingCastle et correction des vulnérabilités critiques remontées",
        "Remplacement du chiffrement DES par AES-256 sur Kerberos, bannissement NTLMv1/LM et forçage NTLMv2",
        "Analyse d'un poste utilisateur dans un scénario de phishing : identification de ce qu'un attaquant aurait pu exploiter",
        "Détection de 3 applications avec CVE critiques ou hautes (Notepad++, VLC, 7-Zip), remontée et correction appliquée",
        "Recommandation et mise en place d'alertes sur l'exécution de scripts depuis les postes utilisateurs",
        "Mise en place d'une politique de whitelisting des exécutables et scripts via Sophos",
        "Configuration d'alertes Wazuh sur les pics de requêtes LDAP (détection de reconnaissance réseau)",
        "Mise en service et vérification de liaisons réseau, configuration de VLANs, tests de débit avec iPerf"
      ] },
      { h: 'Outils & technologies', p: "PingCastle, Active Directory, Kerberos (AES-256), NTLM, Wazuh, Sophos, VLAN, iPerf." },
      { h: "Ce que ça m'a appris", p: "Voir un SI réel sous l'angle attaquant : partir d'un poste compromis et cartographier ce qui serait exploitable. Ça m'a aussi montré l'importance des alertes préventives, car détecter avant que ça arrive vaut mieux que réagir après." }
    ]
  }
};
const modalOverlay = document.getElementById('project-modal');
const modalEl = modalOverlay ? modalOverlay.querySelector('.modal') : null;
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close');
let lastFocused = null;

/* Doit rester ≥ la transition de .modal-overlay dans le CSS (220ms) */
const MODAL_ANIM_MS = 240;
/* Éléments rendus inertes (focus + lecteurs d'écran) pendant l'ouverture */
const modalInertEls = ['header', 'main', 'footer'].map(s => document.querySelector(s));

function buildModalContent(data) {
  modalContent.textContent = '';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'modal-eyebrow';
  eyebrow.textContent = data.eyebrow;
  modalContent.appendChild(eyebrow);

  const title = document.createElement('h3');
  title.className = 'modal-title';
  title.id = 'modal-title';
  title.textContent = data.title;
  modalContent.appendChild(title);

  if (data.tags && data.tags.length) {
    const tagWrap = document.createElement('div');
    tagWrap.className = 'modal-tags';
    data.tags.forEach(t => {
      const tag = document.createElement('span');
      tag.className = 'modal-tag';
      tag.textContent = t;
      tagWrap.appendChild(tag);
    });
    modalContent.appendChild(tagWrap);
  }

  data.blocks.forEach(block => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-block';

    const h = document.createElement('h4');
    h.textContent = block.h;
    wrap.appendChild(h);

    if (block.items && block.items.length) {
      const ul = document.createElement('ul');
      block.items.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    } else if (block.p) {
      const p = document.createElement('p');
      p.textContent = block.p;
      wrap.appendChild(p);
    }
    modalContent.appendChild(wrap);
  });
}

function openModal(key) {
  const data = PROJECTS[key];
  if (!data || !modalOverlay) return;
  lastFocused = document.activeElement;
  buildModalContent(data);
  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  modalInertEls.forEach(el => el && el.setAttribute('inert', ''));
  requestAnimationFrame(() => modalOverlay.classList.add('open'));
  if (modalEl) modalEl.focus();
}

function closeModal() {
  if (!modalOverlay || modalOverlay.hidden) return;
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  modalInertEls.forEach(el => el && el.removeAttribute('inert'));
  setTimeout(() => { modalOverlay.hidden = true; }, MODAL_ANIM_MS);
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

document.querySelectorAll('.project-detail-btn').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.project));
});

if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (modalOverlay && modalOverlay.hidden) return;
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key === 'Tab' && modalEl) {
    const focusables = modalEl.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
});
