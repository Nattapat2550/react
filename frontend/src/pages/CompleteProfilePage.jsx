import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const emailParam = query.get('email') || '';

  const [email] = useState(emailParam);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await api.post('/api/auth/complete-profile', { email, username, password });
      // ล็อกอินสำเร็จ -> ไปหน้า Home
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete profile');
    }
  };

  return (
    <div>
      <h2>Complete Profile</h2>
      <p className="muted">Please set your username and password to continue.</p>
      
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <label>Email</label>
        <input type="email" value={email} disabled style={{ backgroundColor: '#f0f0f0' }} />

        <label>Username</label>
        <input 
          type="text" 
          required 
          autoComplete="username"
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
        />

        <label>Password</label>
        <input 
          type="password" 
          required 
          autoComplete="new-password"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />

        <label>Confirm Password</label>
        <input 
          type="password" 
          required 
          autoComplete="new-password"
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
        />

        <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Save & Login</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>
    </div>
  );
};

export default CompleteProfilePage;