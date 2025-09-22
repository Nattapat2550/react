const express = require('express');
const User = require('../models/User');
const router = express.Router();
const isAdmin = require('../middleware/auth').isAdmin;

// View all users (admin only)
router.get('/users', isAdmin, async (req, res) => {
  const users = await User.getAllUsers();
  res.json(users);
});

// Edit user (admin only, SQL-like: update any field)
router.put('/users/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // e.g., { role: 'admin', username: 'new' }
  await User.updateProfile(id, updates);
  res.json({ msg: 'User  updated' });
});

// Delete user (admin only)
router.delete('/users/:id', isAdmin, async (req, res) => {
  await User.delete(req.params.id);
  res.json({ msg: 'User  deleted' });
});

module.exports = router;