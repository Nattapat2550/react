import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import api from '../api';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, role } = useSelector((s) => s.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [me, setMe] = useState(null);

  const menuRef = useRef(null);

  const pathname = location.pathname;

  const SHARED_PAGES = useMemo(() => new Set(['/about', '/contact', '/download']), []);
  const onSharedPage = SHARED_PAGES.has(pathname);

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

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'dark';
    setDark(saved);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // click outside → close dropdown
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setDropdownOpen(false);
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
  const homeHref = isAuthenticated ? '/home' : '/';

  // ลิงก์แบบ docker (หน้า public จะมี Home + อีก 2-3 เมนู)
  const renderSharedLinks = () => {
    if (pathname === '/about') {
      return (
        <>
          <NavLink to={homeHref}>Home</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/download">Download</NavLink>
        </>
      );
    }
    if (pathname === '/contact') {
      return (
        <>
          <NavLink to={homeHref}>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/download">Download</NavLink>
        </>
      );
    }
    // /download
    return (
      <>
        <NavLink to={homeHref}>Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </>
    );
  };

  return (
    <div>
      <nav className="nav">
        <Link to={homeHref} className="brand">
          MySite
        </Link>

        <div className="links">
          {onSharedPage ? (
            renderSharedLinks()
          ) : (
            <>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              <NavLink to="/download">Download</NavLink>
            </>
          )}

          <button
            id="themeToggle"
            type="button"
            onClick={() => setDark((prev) => !prev)}
            title="Toggle Theme"
          >
            🌓
          </button>

          {/* ให้เหมือน docker: หน้า public ไม่โชว์ user-menu */}
          {isAuthenticated && !onSharedPage && (
            <div
              ref={menuRef}
              id="userMenu"
              className={'user-menu' + (dropdownOpen ? ' open' : '')}
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <img
                id="avatar"
                src={me?.profile_picture_url || '/images/user.png'}
                alt="avatar"
              />
              <span id="uname">{userDisplayName}</span>

              <div className="dropdown">
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                  Settings
                </Link>

                {role === 'admin' && (
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
