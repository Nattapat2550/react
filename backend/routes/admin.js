// backend/routes/admin.js
const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const { getAllUsers } = require('../models/user');
const { callPureApi } = require('../utils/pureApi'); // เพิ่มบรรทัดนี้
const multer = require('multer');
const upload = multer({ limits: { fileSize: 4 * 1024 * 1024 } });

const router = express.Router();

router.get('/users', authenticateJWT, isAdmin, async (_req, res) => {
  // models/user.js ถูกแก้ให้เรียก API แล้ว เรียกใช้ได้เลย
  const users = await getAllUsers();
  res.json(users);
});

router.put('/users/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    // ตรงนี้ต้องเรียก API โดยตรง หรือจะเพิ่ม function ใน model ก็ได้
    // แต่เพื่อความชัวร์ เรียก pureApi ตรงนี้เลย
    const updated = await callPureApi('/admin/users/update', 'POST', { id, ...body });
    
    if (!updated) return res.status(404).json({ error: 'Not found or Update failed' });
    res.json(updated);
  } catch (e) {
    console.error('admin update user error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Carousel endpoints (เรียกผ่าน Model ซึ่งแก้ไปแล้ว)
const {
  createCarouselItem, updateCarouselItem, deleteCarouselItem, listCarouselItems
} = require('../models/carousel');

router.get('/carousel', authenticateJWT, isAdmin, async (_req, res) => {
  const items = await listCarouselItems();
  res.json(items);
});

router.post('/carousel', authenticateJWT, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { itemIndex, title, subtitle, description } = req.body || {};
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    
    const mime = req.file.mimetype;
    const b64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${b64}`;
    
    const created = await createCarouselItem({
      itemIndex: itemIndex !== undefined ? Number(itemIndex) : 0,
      title, subtitle, description, imageDataUrl: dataUrl
    });
    res.status(201).json(created);
  } catch (e) {
    console.error('admin create carousel error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.put('/carousel/:id', authenticateJWT, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { itemIndex, title, subtitle, description } = req.body || {};
    let dataUrl = null;
    if (req.file) {
      const mime = req.file.mimetype;
      const b64 = req.file.buffer.toString('base64');
      dataUrl = `data:${mime};base64,${b64}`;
    }
    const updated = await updateCarouselItem(id, {
      itemIndex: itemIndex !== undefined && itemIndex !== '' ? Number(itemIndex) : undefined,
      title, subtitle, description, imageDataUrl: dataUrl
    });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    console.error('admin update carousel error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/carousel/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deleteCarouselItem(id);
    res.status(204).end();
  } catch (e) {
    console.error('admin delete carousel error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;