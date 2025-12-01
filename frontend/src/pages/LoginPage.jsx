import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearAuthError } from '../slices/authSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, status, error } = useSelector(
    (s) => s.auth
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      const dest =
        role === 'admin'
          ? '/admin'
          : (location.state && location.state.from?.pathname) || '/home';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, role, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await dispatch(login({ email, password, remember })).unwrap();
    } catch (errMsg) {
      setLocalError(errMsg || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    // ใช้ endpoint เดิม
    api.defaults.withCredentials = true;
    window.location.href = `${api.defaults.baseURL}/api/auth/google`;
  };

  return (
    <section>
      <h2>Login</h2>
      <button type="button" onClick={handleGoogleLogin}>
        Login with Google
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
        <div>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
        </div>
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>
        <a href="/reset">Forgot password?</a>
      </p>

      {(localError || error) && (
        <p style={{ color: 'red' }}>{localError || error}</p>
      )}
    </section>
  );
};

export default LoginPage;
