import React, { useEffect, useState } from 'react';
import api from '../api';

const SettingsPage = () => {
  const [me, setMe] = useState(null);
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/users/me');
        if (cancelled) return;
        setMe(res.data);
        setUsername(res.data?.username || '');
      } catch (e) {
        if (!cancelled) setMsg('Failed to load profile');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.put('/api/users/me', { username: username.trim() });
      setMe(res.data);
      setMsg('Saved.');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Save failed');
    }
  };

  const uploadAvatar = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!avatarFile) {
      setMsg('Please choose an image file.');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);

      const res = await fetch(`${api.defaults.baseURL}/api/users/me/avatar`, {
        method: 'POST',
        credentials: 'include',
        headers: (() => {
          const t = localStorage.getItem('token') || sessionStorage.getItem('token');
          return t ? { Authorization: `Bearer ${t}` } : undefined;
        })(),
        body: fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(j.error || 'Upload failed');
      }

      const j = await res.json();
      setMe((m) => ({ ...(m || {}), profile_picture_url: j.profile_picture_url }));
      setMsg('Avatar updated.');
      setAvatarFile(null);
      e.target.reset();
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    }
  };

  const deleteMe = async () => {
    if (!confirm('Delete account? This cannot be undone.')) return;
    setMsg('');
    try {
      await api.delete('/api/users/me');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/';
    } catch (e) {
      setMsg(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <>
      <h1>Settings</h1>
      <p className="muted">Update your profile and preferences.</p>

      <section className="card">
        <h2>Profile</h2>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <img
            src={me?.profile_picture_url || '/images/user.png'}
            alt="avatar"
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div><b>{me?.email || ''}</b></div>
            <div className="muted">Role: {me?.role || 'user'}</div>
          </div>
        </div>

        <form onSubmit={saveProfile} style={{ marginTop: 16 }}>
          <label>Username</label>
          <input
            type="text"
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button className="btn" type="submit">Save</button>
        </form>
      </section>

      <section className="card">
        <h2>Avatar Upload</h2>
        <form onSubmit={uploadAvatar}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />
          <button className="btn" type="submit">Upload</button>
        </form>
      </section>

      <section className="card">
        <h2>Danger Zone</h2>
        <button className="btn danger" type="button" onClick={deleteMe}>
          Delete Account
        </button>
      </section>

      <p className="muted" id="msg">{msg}</p>
    </>
  );
};

export default SettingsPage;
