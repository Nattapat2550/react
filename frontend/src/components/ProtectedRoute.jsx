// src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { checkAuthStatus } from '../slices/authSlice';

const ProtectedRoute = ({ children, roles }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, role, status } = useSelector(state => state.auth);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(checkAuthStatus());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    // แสดง skeleton / loading เฉพาะหน้า protected
    return <div>กำลังตรวจสอบสิทธิ์...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;