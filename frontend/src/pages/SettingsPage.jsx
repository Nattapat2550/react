import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/api/auth/me');
        const user = res.data.data;
        setUsername(user.username || '');
        setEmail(user.email || '');
        setAvatarUrl(user.profile_picture_url || '');
      } catch {
        navigate('/');
      }
    };
    loadMe();
  }, [navigate]);

  return (
    <>
      <h2>Settings</h2>
      
      {avatarUrl && (
         <img src={avatarUrl} alt="Avatar" style={{width:80, height:80, borderRadius:'50%', marginBottom:'1rem', objectFit:'cover'}} />
      )}

      <div>
        <label>Email (Read only)</label>
        <input type="text" value={email} disabled />
      </div>

      <div>
        <label>Username (Read only)</label>
        <input type="text" value={username} disabled />
      </div>

      <div style={{marginTop: '2rem', padding: '1rem', background: '#f8d7da', color: '#721c24', borderRadius: '5px'}}>
        <strong>Note:</strong> Editing profile is disabled because the backend server does not support it yet.
      </div>
    </>
  );
};

export default SettingsPage;