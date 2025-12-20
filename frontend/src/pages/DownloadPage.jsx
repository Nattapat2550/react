import React from 'react';
import api from '../api';

const DownloadPage = () => {
  const base = api.defaults.baseURL;

  return (
    <>
      <h1>Download MyApp</h1>
      <p className="muted">เลือกแพลตฟอร์มที่ต้องการติดตั้งแอป</p>

      <div className="card-grid">
        <section className="card">
          <h2>Windows</h2>
          <p>ไฟล์ติดตั้งเดสก์ท็อป <code>MyAppSetup.exe</code></p>
          <button
            className="btn primary"
            type="button"
            onClick={() => { window.location.href = `${base}/api/download/windows`; }}
          >
            Download for Windows
          </button>
        </section>

        <section className="card">
          <h2>Android</h2>
          <p>ไฟล์ติดตั้งแอปมือถือ <code>app-release.apk</code></p>
          <button
            className="btn"
            type="button"
            onClick={() => { window.location.href = `${base}/api/download/android`; }}
          >
            Download for Android
          </button>
        </section>
      </div>
    </>
  );
};

export default DownloadPage;
