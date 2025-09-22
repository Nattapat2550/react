// Integrated into RegisterForm; standalone for Google skip
import React from 'react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Form = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If Google login, auto-complete or redirect to home
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      onLogin(token, user, user.role === 'admin' ? '/admin' : '/home');
    } else {
      navigate('/register'); // Fallback to full reg
    }
  }, [location, navigate, onLogin]);

  return <div>Loading form...</div>; // Or full form if not Google
};

export default Form;