import axios from 'axios';

function normalizeBaseUrl(url) {
  if (!url) return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const envBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.endsWith('.local');

const API_BASE_URL = normalizeBaseUrl(
  envBase ||
    (isLocal
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : 'https://backendlogins.onrender.com') // fallback ให้เหมือน docker
);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ✅ ใส่ Authorization ทุกครั้งถ้ามี token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ ถ้า 401 ให้ล้าง token กัน loop guard
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;