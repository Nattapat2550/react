import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post('/api/auth/register', { email: email.trim() });
      sessionStorage.setItem('pendingEmail', email.trim());
      navigate('/check');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Register failed');
    }
  };

  const handleGoogle = () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/google`;
  };

  return (
    <section>
      <h2>Register</h2>
      <button type="button" onClick={handleGoogle}>
        Continue with Google
      </button>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
          </label>
        </div>
        <button type="submit">Send verification code</button>
      </form>
      {msg && <p style={{ color: 'red' }}>{msg}</p>}
    </section>
  );
};

export default RegisterPage;
