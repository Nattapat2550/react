const express = require('express');
const api = require('../config/api'); // เปลี่ยนจาก pool
const { authenticateJWT, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const { data } = await api.get('/api/internal/homepage/list');
    res.json(data.data);
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

router.put('/', authenticateJWT, isAdmin, async (req, res) => {
  const { section_name, content } = req.body || {};
  if (!section_name) return res.status(400).json({ error: 'Missing section_name' });
  try {
    const { data } = await api.post('/api/internal/homepage/update', { section_name, content });
    res.json(data.data);
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;