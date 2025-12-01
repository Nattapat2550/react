import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const LandingPage = () => {
  const { isAuthenticated, role } = useSelector((s) => s.auth);

  if (isAuthenticated) {
    return (
      <Navigate to={role === 'admin' ? '/admin' : '/home'} replace />
    );
  }

  return (
    <section>
      <h1>Welcome</h1>
      <p>This is the landing page of your React + Redux system.</p>
      <div>
        <Link to="/login">Login</Link>
        {' | '}
        <Link to="/register">Register</Link>
      </div>
    </section>
  );
};

export default LandingPage;
