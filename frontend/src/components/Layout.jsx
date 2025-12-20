import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import api from '../api';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, role } = useSelector((s) => s.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [me, setMe] = useState(null);
  const menuRef = useRef(null);

  // โหลดข้อมูล user สำหรับแสดงชื่อ + avatar
  useEffect(() => {
    let cancelled = false;
    const loadMe = async () => {
      if (!isAuthenticated) {
        setMe(null);
        return;
      }
      try {
        const res = await api.get('/api/users/me');
        if (!cancelled) setMe(res.data);
      } catch {
        if (!cancelled) setMe(null);
      }
    };
    loadMe();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // theme
  useEffect(() => {
    setDark(localStorage.getItem('theme') === 'dark');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // ✅ คลิกนอกเมนูให้ปิด (เหมือน docker)
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } finally {
      setDropdownOpen(false);
      navigate('/');
    }
  };

  const userDisplayName = me?.username || me?.email || 'User';

  return (
    <div>
      <nav className="nav">
        <Link to="/" className="brand">
          MySite
        </Link>

        <div className="links">
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/download">Download</NavLink>

          <button
            id="themeToggle"
            type="button"
            onClick={() => setDark((p) => !p)}
            title="Toggle Theme"
          >
            🌓
          </button>

          {isAuthenticated && (
            <div
              ref={menuRef}
              className={'user-menu' + (dropdownOpen ? ' open' : '')}
              onClick={() => setDropdownOpen((o) => !o)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setDropdownOpen((o) => !o);
              }}
            >
              <img
                src={me?.profile_picture_url || '/images/user.png'}
                alt="avatar"
              />
              <span>{userDisplayName}</span>

              <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                  Settings
                </Link>
                {(role || '').toLowerCase() === 'admin' && (
                  <Link to="/admin" onClick={() => setDropdownOpen(false)}>
                    Admin
                  </Link>
                )}
                <button type="button" className="linklike" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="container">{children}</main>
    </div>
  );
};

export default Layout;
