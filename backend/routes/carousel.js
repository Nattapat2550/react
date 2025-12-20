// react/backend/routes/carousel.js
const express = require('express');
const router = express.Router();
const { 
  getCarouselItems, 
  addCarouselItem, 
  deleteCarouselItem 
} = require('../models/carousel');
const { authenticateJWT, isAdmin } = require('../middleware/auth'); // ใช้ middleware กลางที่มีอยู่แล้ว

// ดึงข้อมูล Carousel (Public)
router.get('/', async (req, res, next) => {
  try {
    const items = await getCarouselItems();
    // Frontend คาดหวัง res.data.data เป็น array
    res.json({ ok: true, data: items || [] });
  } catch (err) {
    next(err);
  }
});

// เพิ่ม Slide (Admin Only)
router.post('/', authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    // Frontend ส่ง title, description, image_dataurl มา
    const result = await addCarouselItem(req.body);
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ลบ Slide (Admin Only)
router.delete('/:id', authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteCarouselItem(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;