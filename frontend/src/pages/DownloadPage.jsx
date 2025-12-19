import React, { useEffect, useState } from 'react';
import api from '../api';

const DownloadPage = () => {
  const [os, setOs] = useState('unknown');

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf('Win') !== -1) setOs('Windows');
    else if (userAgent.indexOf('Android') !== -1) setOs('Android');
    else if (userAgent.indexOf('Mac') !== -1) setOs('MacOS');
    else if (userAgent.indexOf('Linux') !== -1) setOs('Linux');
    else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) setOs('iOS');
  }, []);

  const handleDownload = (platform) => {
    // Redirect ไปที่ Endpoint ของ Backend เพื่อเริ่มดาวน์โหลด (Proxy)
    window.location.href = `${api.defaults.baseURL}/api/download/${platform}`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem', padding: '0 1rem' }}>
      <h2>Download Application</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Select the version compatible with your device.
      </p>

      {os !== 'unknown' && (
        <div style={{ marginBottom: '2rem', display: 'inline-block', padding: '0.5rem 1rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '50px', fontSize: '0.9rem' }}>
          Detected OS: <strong>{os}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        
        {/* Windows Button */}
        <button 
          className={`btn ${os === 'Windows' || os === 'unknown' ? '' : 'outline'}`} 
          style={{ minWidth: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          onClick={() => handleDownload('windows')}
        >
          <span>Download for Windows (.exe)</span>
        </button>

        {/* Android Button */}
        <button 
          className={`btn ${os === 'Android' ? '' : 'outline'}`} 
          style={{ minWidth: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          onClick={() => handleDownload('android')}
        >
          <span>Download for Android (.apk)</span>
        </button>

        {/* Warning for unsupported OS */}
        {os !== 'Windows' && os !== 'Android' && os !== 'unknown' && (
             <p style={{ marginTop: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>
               Sorry, currently we only support Windows and Android.
             </p>
        )}
      </div>
    </div>
  );
};

export default DownloadPage;