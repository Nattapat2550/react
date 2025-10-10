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
  // admin: allow all
}
