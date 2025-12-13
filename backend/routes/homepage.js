// backend/routes/homepage.js
const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const { callPureApi } = require('../utils/pureApi'); // เรียกใช้ pureApi

const router = express.Router();

router.get('/', async (_req, res) => {
  const data = await callPureApi('/homepage/list', 'GET') || [];
  res.json(data);
});

router.put('/', authenticateJWT, isAdmin, async (req, res) => {
  const { section_name, content } = req.body || {};
  if (!section_name) return res.status(400).json({ error: 'Missing section_name' });
  
  const result = await callPureApi('/homepage/update', 'POST', { section_name, content });
  if (!result) return res.status(500).json({ error: 'Update failed' });
  res.json(result);
});

module.exports = router;