import React, { useEffect, useState } from 'react';
import api from '../api';

const HomePage = () => {
  const [me, setMe] = useState(null);
  const [content, setContent] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [meRes, contentRes] = await Promise.all([
          api.get('/api/users/me'),
          api.get('/api/homepage')
        ]);
        if (cancelled) return;

        setMe(meRes.data);
        const map = {};
        (contentRes.data || []).forEach((c) => {
          map[c.section_name] = c.content;
        });
        setContent(map);
      } catch (err) {
        if (!cancelled) {
          setMsg(err.response?.data?.error || 'Failed to load home data');
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const welcomeText =
    content.welcome_header ||
    `Welcome, ${me?.username || me?.email || 'user'}`;
  const mainParagraph =
    content.main_paragraph || 'This is your dashboard.';

  return (
    <section>
      <h2>{welcomeText}</h2>
      <p>{mainParagraph}</p>
      {me && (
        <p>
          Logged in as <b>{me.username || me.email}</b>{' '}
          ({me.role || 'user'})
        </p>
      )}
      {msg && <p style={{ color: 'red' }}>{msg}</p>}
    </section>
  );
};

export default HomePage;
