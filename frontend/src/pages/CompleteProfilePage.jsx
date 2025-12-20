import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const e = sp.get('email') || '';
    setEmail(e);
  }, [sp]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    try {
      const res = await api.post('/api/auth/complete-profile', {
        email: email.trim(),
        username: username.trim(),
        password,
      });

      // ✅ เหมือน docker: เก็บ token แล้วไป home
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      navigate('/home');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Save failed');
    }
  };

  return (
    <>
      <h2>Set username & password</h2>
      <form id="profileForm" onSubmit={onSubmit}>
        <label>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Username</label>
        <input type="text" minLength={3} required value={username} onChange={(e) => setUsername(e.target.value)} />

        <label>Password</label>
        <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="btn" type="submit">Save</button>
      </form>
      <p className="muted">{msg}</p>
    </>
  );
};

export default CompleteProfilePage;
