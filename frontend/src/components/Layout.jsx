import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } finally {
      navigate('/');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="logo">
          React Auth
        </Link>
        <nav className="nav">
          {isAuthenticated && (
            <>
              <NavLink to="/home">Home</NavLink>
              <NavLink to="/settings">Settings</NavLink>
              <NavLink to="/download">Download</NavLink>
              {role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            </>
          )}
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          ) : (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};

export default Layout;
