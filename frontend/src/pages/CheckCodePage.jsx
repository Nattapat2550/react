import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CheckCodePage = () => {
  const navigate = useNavigate();
  const pendingEmail = useMemo(() => sessionStorage.getItem('pendingEmail'), []);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  if (!pendingEmail) {
    // เหมือน docker: ถ้าไม่มี pendingEmail ให้กลับ register
    navigate('/register', { replace: true });
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/auth/verify-code', {
        email: pendingEmail,
        code: code.trim(),
      });
      navigate(`/form?email=${encodeURIComponent(pendingEmail)}`);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Invalid or expired code');
    }
  };

  return (
    <>
      <h2>Enter 6-digit code</h2>
      <form id="codeForm" onSubmit={onSubmit}>
        <label>Code</label>
        <input
          type="text"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn" type="submit">Verify</button>
      </form>
      <p className="muted">{msg}</p>
    </>
  );
};

export default CheckCodePage;
