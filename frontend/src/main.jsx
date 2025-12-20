import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { Provider } from 'react-redux';
import store from './store';

// ✅ รับ token จาก URL fragment (#token=...&role=...) แล้วเก็บลง localStorage เหมือน docker
(function captureTokenFromHash() {
  try {
    if (!window.location.hash || window.location.hash.length < 2) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    if (!token) return;

    localStorage.setItem('token', token);
    // ลบ hash ออกกันวนซ้ำ
    window.history.replaceState(
      null,
      document.title,
      window.location.pathname + window.location.search
    );
  } catch {}
})();

// ✅ apply theme เหมือน docker
(function applyTheme() {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark');
    }
  } catch {}
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
