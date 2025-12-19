import React, { useEffect, useState } from 'react';
import api from '../api';

const DownloadPage = () => {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/download');
        // ✅ Rust ส่งกลับมาเป็น { ok: true, data: [...] }
        setItems(res.data.data || []);
      } catch (err) {
        setMsg(err.response?.data?.error || 'Failed to load downloads');
      }
    };
    load();
  }, []);

  return (
    <>
      <h2>Download</h2>
      {msg && <p className="muted" style={{ color: 'red' }}>{msg}</p>}

      <div className="download-list" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {items.map((d) => (
          <div key={d.id} className="download-card" style={{ padding: '1rem', border: '1px solid #ddd' }}>
            <h3>{d.title || 'File'}</h3>
            {d.description && <p className="muted">{d.description}</p>}
            <a href={d.file_url} className="btn" target="_blank" rel="noreferrer">Download</a>
          </div>
        ))}
      </div>
    </>
  );
};

export default DownloadPage;