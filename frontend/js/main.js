// ===== frontend/js/main.js =====
const API_BASE_URL = 'https://react1-k4e2.onrender.com';

/* ==== React-friendly API helper (keep same signature) ==== */
window.api = async function api(path, { method='GET', body, headers } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    credentials: 'include'
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE_URL + path, opts);
  if (!res.ok) {
    let err = 'Request failed';
    try { const j = await res.json(); err = j.error || JSON.stringify(j); } catch {}
    const e = new Error(err);
    e.status = res.status;
    throw e;
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

/* ==== Theme toggle ==== */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }
  guard();
});

/* ==== Route Guard ==== */
async function getMeSafe() {
  try { return await api('/api/users/me'); }
  catch (e) { if (e && e.status === 401) return null; throw e; }
}

async function guard() {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const PUBLIC = new Set(['', 'index.html', 'about.html', 'contact.html', 'login.html', 'register.html', 'reset.html', 'check.html']);
  const USER_ONLY = new Set(['home.html', 'settings.html']);
  const ADMIN_ONLY = new Set(['admin.html', 'form.html']);

  if (PUBLIC.has(page)) return;

  const me = await getMeSafe();
  if (!me) { location.replace('index.html'); return; }

  if (me.role !== 'admin') {
    if (!(USER_ONLY.has(page) || PUBLIC.has(page))) {
      location.replace('home.html'); return;
    }
  }
  // admin allow all
}

/* ==== Dropdowns (legacy + data-*) ==== */
(function initDropdowns(){
  // legacy: #menuBtn toggles #menu
  function legacyInit() {
    const btn  = document.getElementById('menuBtn');
    const menu = document.getElementById('menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
      const isOpen = menu.classList.contains('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('open')) return;
      const inside = menu.contains(e.target) || btn.contains(e.target);
      if (!inside) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // data-* flexible dropdowns
  function dataAttrInit() {
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-dd-toggle],[data-dd-target]');
      if (!t) return;
      const targetId = t.getAttribute('data-dd-toggle') || t.getAttribute('data-dd-target');
      if (!targetId) return;
      const menu = document.getElementById(targetId);
      if (!menu) return;

      e.preventDefault();
      e.stopPropagation();

      const willOpen = menu.classList.contains('hidden') || !menu.classList.contains('open');

      // close others
      document.querySelectorAll('[data-dd-menu].open, [data-dd-menu]:not(.hidden)').forEach(el=>{
        if (el !== menu) {
          el.classList.add('hidden');
          el.classList.remove('open');
          const b = document.querySelector(`[data-dd-toggle="${el.id}"],[data-dd-target="${el.id}"]`);
          if (b) b.setAttribute('aria-expanded','false');
        }
      });

      if (willOpen) {
        menu.classList.remove('hidden');
        menu.classList.add('open');
        t.setAttribute('aria-expanded','true');
        menu.setAttribute('aria-hidden','false');
      } else {
        menu.classList.add('hidden');
        menu.classList.remove('open');
        t.setAttribute('aria-expanded','false');
        menu.setAttribute('aria-hidden','true');
      }
    });

    document.addEventListener('click', (e) => {
      document.querySelectorAll('[data-dd-menu].open, [data-dd-menu]:not(.hidden)').forEach(menu=>{
        const btn = document.querySelector(`[data-dd-toggle="${menu.id}"],[data-dd-target="${menu.id}"]`);
        const inside = menu.contains(e.target) || (btn && btn.contains(e.target));
        if (!inside) {
          menu.classList.add('hidden');
          menu.classList.remove('open');
          menu.setAttribute('aria-hidden','true');
          if (btn) btn.setAttribute('aria-expanded','false');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('[data-dd-menu]').forEach(menu=>{
        if (menu.classList.contains('open') || !menu.classList.contains('hidden')) {
          menu.classList.add('hidden');
          menu.classList.remove('open');
          menu.setAttribute('aria-hidden','true');
          const btn = document.querySelector(`[data-dd-toggle="${menu.id}"],[data-dd-target="${menu.id}"]`);
          if (btn) btn.setAttribute('aria-expanded','false');
        }
      });
    });
  }

  legacyInit();
  dataAttrInit();
})();
