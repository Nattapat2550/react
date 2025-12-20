import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { checkAuthStatus } from '../slices/authSlice';

const GuestRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, role, status } = useSelector((s) => s.auth);

  useEffect(() => {
    if (status === 'idle') dispatch(checkAuthStatus());
  }, [status, dispatch]);

  if (status === 'idle' || status === 'loading') {
    return <div className="page-loading">กำลังโหลด...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={(role || 'user').toLowerCase() === 'admin' ? '/admin' : '/home'} replace />;
  }

  return children;
};

export default GuestRoute;
