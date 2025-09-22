const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('../middleware/multer'); // Upload middleware
const fs = require('fs');
const router = express.Router();

// Get current user profile
router.get('/profile', async (req, res) => {
  const user = await User.findByEmail(req.user.email); // Use req.user from middleware
  res.json({ username: user.username, profilePic: user.profile_pic, theme: user.theme });
});

// Update profile (name, pic, theme)
router.put('/profile', multer, async (req, res) => {
  const updates = { username: req.body.username, theme: req.body.theme };
  if (req.file) {
    // For simplicity, store as base64 (in prod, use cloud URL)
    const picData = fs.readFileSync(req.file.path, 'base64');
    updates.profile_pic = `data:${req.file.mimetype};base64,${picData}`;
    fs.unlinkSync(req.file.path); // Clean up temp file
  }
  await User.updateProfile(req.user.id, updates);
  res.json({ msg: 'Profile updated' });
});

// Delete account
router.delete('/profile', async (req, res) => {
  await User.delete(req.user.id);
  res.json({ msg: 'Account deleted' });
});

module.exports = router;