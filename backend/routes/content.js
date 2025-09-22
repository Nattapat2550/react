const express = require('express');
const SiteContent = require('../models/SiteContent');
const isAdmin = require('../middleware/auth').isAdmin;
const router = express.Router();

// Get home page content
router.get('/', async (req, res) => {
  const content = await SiteContent.get();
  res.json(content);
});

// Update content (admin only)
router.put('/', isAdmin, async (req, res) => {
  const { title, content } = req.body;
  await SiteContent.update(title, content);
  res.json({ msg: 'Content updated' });
});

module.exports = router;