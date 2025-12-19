import axios from 'axios';

const API_BASE_URL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://react1-k4e2.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// ✅ Interceptor: ฝั่ง Token ไปกับ Header ทุกครั้ง
api.interceptors.request.use(
  (config) => {
    // ดึง Token จาก Local หรือ Session
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;