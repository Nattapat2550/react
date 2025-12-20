// react/backend/middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  // 1. ลองดึง Token จาก Cookie หรือ Header
  let token = req.cookies?.token;
  
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    // ถ้าไม่มี token เลย
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, ... }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin only' });
  }
}

// Helper สำหรับตั้ง Cookie (ใช้ใน Login/Register/OAuth)
function setAuthCookie(res, token, remember = false) {
  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30วัน หรือ 1วัน
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true ถ้าเป็น https
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge,
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });
}

function extractToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }
  return null;
}

module.exports = {
  authenticateJWT,
  isAdmin,
  setAuthCookie,
  clearAuthCookie,
  extractToken
};