// ===== frontend/js/main.js =====
const API_BASE_URL = 'https://react1-k4e2.onrender.com';

/* ==== React-friendly API helper (keep same signature) ==== */
window.api = async function api(path, { method='GET', body, headers } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    credentials: 'include'   // สำคัญ: ให้ส่ง cookie ไป-กลับกับ backend
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE_URL + path, opts);
  if (!res.ok) {
    // ส่ง error ชัดๆ ให้ผู้เรียกจัดการ (เช่น guard)
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

  // เรียก guard ทุกหน้า
  guard();
});

/* ==== Route Guard ==== */
async function getMeSafe() {
  try {
    return await api('/api/users/me');
  } catch (e) {
    if (e && e.status === 401) return null; // ยังไม่ได้ล็อกอิน
    throw e; // error อื่นให้เด้งดังเดิม (จะเห็นใน console)
  }
}

async function guard() {
  // ไฟล์หน้าปัจจุบัน
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // เพจ public (ไม่ต้องล็อกอิน)
  const PUBLIC = new Set(['', 'index.html', 'about.html', 'contact.html', 'login.html', 'register.html', 'reset.html', 'check.html']);
  // เพจที่อนุญาตสำหรับ user
  const USER_ONLY = new Set(['home.html', 'settings.html']);
  // เพจ admin
  const ADMIN_ONLY = new Set(['admin.html', 'form.html']);

  // หน้า public ไม่ต้องตรวจ
  if (PUBLIC.has(page)) return;

  const me = await getMeSafe();

  // ถ้าไม่ล็อกอิน → อนุญาตเฉพาะหน้า public เท่านั้น
  if (!me) {
    // ถ้าเผลอเข้าหน้าอื่น → เด้งกลับ index
    location.replace('index.html');
    return;
  }

  // ล็อกอินแล้วแต่ role เป็น user
  if (me.role !== 'admin') {
    // ถ้าไม่ใช่หน้า public และไม่ใช่หน้า user-only → กลับ home
    if (!(USER_ONLY.has(page) || PUBLIC.has(page))) {
      location.replace('home.html');
      return;
    }
  } else {
    // admin: ผ่านได้ทุกหน้า (แต่ถ้าอยากบังคับไปหน้า admin เมื่อเปิดหน้าอื่น ก็เปลี่ยนเงื่อนไขตรงนี้ได้)
  }
}