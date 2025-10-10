const API_BASE_URL = 'https://backendlogins.onrender.com';

/* ==== React-friendly API helper (keeps same signature) ==== */
window.api = async function api(path, { method='GET', body, headers } = {}) {
  const opts = { method, headers: { 'Content-Type':'application/json', ...(headers||{}) }, credentials: 'include' };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE_URL + path, opts);
  if (!res.ok) {
    let err = 'Request failed';
    try { const j = await res.json(); err = j.error || JSON.stringify(j); } catch {}
    throw new Error(err);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

/* Theme toggle (works with existing button) */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }
});
