import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from '../slices/authSlice';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search] = useSearchParams();
  
  const [email, setEmail] = useState(search.get('email') || sessionStorage.getItem('pendingEmail') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await api.post('/api/auth/complete-profile', {
        email: email.trim(),
        username: username.trim(),
        password
      });

      // ✅ รับ Token จาก Backend แล้ว Save เลย
      const { token } = res.data.data;
      if (token) {
        localStorage.setItem('token', token);
      }

      await dispatch(checkAuthStatus());
      navigate('/home', { replace: true });
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to complete profile');
    }
  };

  return (
    <section>
      <h2>Complete Profile</h2>
      <form onSubmit={handleSubmit}>
        <label>Email <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>Username <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required /></label>
        <label>Password <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        <button type="submit">Save & Login</button>
      </form>
      {msg && <p style={{color:'red'}}>{msg}</p>}
    </section>
  );
};

export default CompleteProfilePage;