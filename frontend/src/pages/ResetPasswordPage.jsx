import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';

const ResetPasswordPage = () => {
  const [sp] = useSearchParams();
  const token = useMemo(() => sp.get('token') || '', [sp]);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const requestLink = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setMsg('If that email exists, a reset link was sent.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Request failed');
    }
  };

  const setPassword = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      setMsg('Password set. You can login now.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Reset failed');
    }
  };

  return (
    <>
      <h2>Password Reset</h2>

      {!token ? (
        <section id="requestBox">
          <p>Enter your email to receive a reset link.</p>
          <form id="requestForm" onSubmit={requestLink}>
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn" type="submit">Send Link</button>
          </form>
        </section>
      ) : (
        <section id="resetBox">
          <p>Enter your new password.</p>
          <form id="resetForm" onSubmit={setPassword}>
            <label>New Password</label>
            <input
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button className="btn" type="submit">Set Password</button>
          </form>
        </section>
      )}

      <p className="muted">{msg}</p>
    </>
  );
};

export default ResetPasswordPage;
