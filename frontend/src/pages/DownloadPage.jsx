import React, { useEffect, useState } from 'react';
import api from '../api';

const DownloadPage = () => {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/download');
        setItems(res.data || []);
      } catch (err) {
        setMsg(err.response?.data?.error || 'Failed to load downloads');
      }
    };
    load();
  }, []);

  return (
    <section>
      <h2>Downloads</h2>
      {msg && <p style={{ color: 'red' }}>{msg}</p>}
      <ul>
        {items.map((d) => (
          <li key={d.id}>
            <a href={d.file_url} target="_blank" rel="noreferrer">
              {d.title || d.file_url}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default DownloadPage;
