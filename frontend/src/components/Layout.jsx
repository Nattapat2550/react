import React, { useEffect, useState } from 'react';
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

  // โหลดข้อมูล user สำหรับแสดงชื่อ + avatar (เฉพาะตอน login)
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

  // จัดการ Theme (Dark/Light)
  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'dark';
    setDark(saved);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleThemeToggle = () => {
    setDark((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } finally {
      setDropdownOpen(false);
      navigate('/');
    }
  };

  const showDownloadLink = true; // แสดงลิงก์ Download เสมอ

  const userDisplayName = me?.username || me?.email || 'User';

  return (
    <div>
      {/* Top Nav */}
      <nav className="nav">
        {/* ส่วนโลโก้: ใส่ className="brand" ที่ Link โดยตรงเพื่อให้สีรุ้งทำงาน */}
        <Link to="/" className="brand">
          MySite
        </Link>

        <div className="links">
          {/* ลิงก์เมนูหลัก */}
          {/* ใช้ NavLink เพื่อให้ React Router จัดการ active state ได้ถ้าต้องการ */}
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          {showDownloadLink && (
            <NavLink to="/download">Download</NavLink>
          )}

          {/* ปุ่มสลับธีม */}
          <button
            id="themeToggle"
            type="button"
            onClick={handleThemeToggle}
            title="Toggle Theme"
          >
            {dark ? '🌙' : '☀️'}
          </button>

          {/* User Menu (แสดงเมื่อ Login แล้ว) */}
          {isAuthenticated && (
            <div
              className={'user-menu' + (dropdownOpen ? ' open' : '')}
            >
              <img
                src={me?.profile_picture_url || '/images/user.png'}
                alt="avatar"
                onClick={() => setDropdownOpen((o) => !o)}
              />
              <span onClick={() => setDropdownOpen((o) => !o)}>
                {userDisplayName}
              </span>
              
              <div className="dropdown">
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                  Settings
                </Link>
                {role === 'admin' && (
                  <Link to="/admin" onClick={() => setDropdownOpen(false)}>
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  className="linklike"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* ถ้ายังไม่ Login ปุ่ม Login/Register จะอยู่ที่หน้า Landing/Login เอง */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container">
        {children}
      </main>
    </div>
  );
};

export default Layout;