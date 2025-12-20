// react/backend/routes/admin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// เรียกใช้ getAllUsers จาก model
const { adminUpdateUser, getAllUsers } = require('../models/user');

function requireAdmin(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({ error: true, message: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.is_admin && decoded.role !== 'admin') { // เช็คทั้ง is_admin และ role
      return res.status(403).json({ error: true, message: 'Admin only' });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    err.status = 401;
    return next(err);
  }
}

// 1. [เพิ่ม] Route สำหรับดึงข้อมูล Users ทั้งหมด
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    // ดึงข้อมูลจาก Pure API ผ่าน Model
    const users = await getAllUsers();
    
    // ส่งกลับในรูปแบบที่ Frontend (AdminPage.jsx) ต้องการ
    // Frontend คาดหวัง: res.data.data.users
    res.json({
      ok: true,
      data: {
        users: users || [],
        total_pages: 1 // Pure API อาจจะยังไม่ทำ pagination ส่ง 1 ไปก่อน
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Route สำหรับอัปเดต User
router.post('/users/update', requireAdmin, async (req, res, next) => {
  try {
    const { id, ...payload } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: true, message: 'Missing user id' });
    }

    const updated = await adminUpdateUser(id, payload);
    // ส่งกลับรูปแบบเดียวกับ GET เพื่อความสม่ำเสมอ
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// รองรับ PATCH ด้วย (AdminPage.jsx เรียกใช้ patch)
router.patch('/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await adminUpdateUser(id, payload);
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;