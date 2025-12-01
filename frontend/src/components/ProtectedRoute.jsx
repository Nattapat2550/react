import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, role, status } = useSelector((s) => s.auth);
  const location = useLocation();

  const loading = status === 'idle' || status === 'loading';

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
