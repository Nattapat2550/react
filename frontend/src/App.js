import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Index from './pages/Index';
import Check from './pages/Check';
import Form from './pages/Form';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme.js';
import jwtDecode from 'jwt-decode';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'https://backendlogins.onrender.com';

function AppContent() {
  const [user, setUser ] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser (decoded);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Fetch profile for theme/pic
        axios.get('/api/users/profile').then(res => {
          setThemeMode(res.data.theme);
        });
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
      }
    }
  }, [token]);

  useEffect(() => {
    // Handle Google callback redirect
    const urlParams = new URLSearchParams(location.search);
    const callbackToken = urlParams.get('token');
    const callbackUser  = urlParams.get('user');
    if (callbackToken && callbackUser ) {
      setToken(callbackToken);
      localStorage.setItem('token', callbackToken);
      setUser (JSON.parse(callbackUser ));
      navigate('/home'); // Or /admin if admin
    }
  }, [location, navigate]);

  const handleLogin = (newToken, newUser , redirect) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setUser (newUser );
    navigate(redirect || '/home');
  };

  const handleLogout = () => {
    setToken(null);
    setUser (null);
    localStorage.removeItem('token');
    navigate('/');
  };

  const updateTheme = (mode) => {
  setThemeMode(mode);
  localStorage.setItem('theme', mode);
  if (mode === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  if (user) {
    axios.put('/api/users/profile', { theme: mode });
  }
};
useEffect(() => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setThemeMode(savedTheme);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}, []);

  return (
    <ThemeProvider theme={theme(themeMode)}>
      {user && <Navbar user={user} onLogout={handleLogout} themeMode={themeMode} onThemeChange={updateTheme} />}
        <Routes>
            <Route path="/" element={<Index onRegister={() => navigate('/register')} onLogin={handleLogin} />} />
            <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterForm onLogin={handleLogin} />} />
            <Route path="/check" element={<Check />} /> {/* If standalone needed */}
            <Route path="/form" element={<Form onLogin={handleLogin} />} />
            <Route path="/home" element={user && user.role !== 'admin' ? <Home user={user} /> : <div>Redirecting...</div>} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin user={user} /> : <div>Admin only - <Button onClick={() => navigate('/login')}>Login</Button></div>} />
        </Routes>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;