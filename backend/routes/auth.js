const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailUtils = require('../utils/email');
const db = require('../models/db');
const router = express.Router();

// Check duplicate email
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmail(email);
  if (user) {
    return res.json({ exists: true });
  }
  res.json({ exists: false });
});

// Send verification code (after email entry)
router.post('/send-verification', async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmail(email);
  if (user) {
    return res.status(400).json({ msg: 'Email already registered' });
  }
  // Create temp user entry for verification
  await db.query(
    'INSERT INTO users (email, verified) VALUES ($1, false)',
    [email]
  );
  const code = await emailUtils.generateAndSendCode(email, 'verification');
  res.json({ msg: 'Code sent', code }); // In prod, don't return code; client verifies
});

// Verify code and proceed to form
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;
  const user = await db.query('SELECT * FROM users WHERE email = $1 AND verification_code = $2 AND verified = false', [email, code]);
  if (user.rows.length === 0) {
    return res.status(400).json({ msg: 'Invalid code' });
  }
  await db.query('UPDATE users SET verified = true, verification_code = null WHERE email = $1', [email]);
  res.json({ msg: 'Verified, proceed to form' });
});

// Complete registration (username + password)
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !user.verified) {
    return res.status(400).json({ msg: 'Email not verified' });
  }
  if (user.username) {
    return res.status(400).json({ msg: 'Already registered' });
  }
  const newUser  = await User.create(email, username, password);
  const token = jwt.sign({ id: newUser .id, role: newUser .role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: newUser .id, email: newUser .email, username: newUser .username, role: newUser .role } });
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  const token = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.redirect(`${process.env.FRONTEND_URL}/form?token=${token}&user=${JSON.stringify({ id: req.user.id, email: req.user.email, username: req.user.username, role: req.user.role })}`);
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !await User.comparePassword(password, user.password)) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }
  if (!user.verified) {
    return res.status(400).json({ msg: 'Email not verified' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const redirect = user.role === 'admin' ? '/admin' : '/home';
  res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role }, redirect });
});

// Forget password: Send reset code
router.post('/forget-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(400).json({ msg: 'Email not found' });
  }
  const code = await emailUtils.generateAndSendCode(email, 'reset');
  res.json({ msg: 'Reset code sent' });
});

// Reset password (verify code + new pw)
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await db.query('SELECT * FROM users WHERE email = $1 AND verification_code = $2', [email, code]);
  if (user.rows.length === 0) {
    return res.status(400).json({ msg: 'Invalid code' });
  }
  const hashedPw = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password = $1, verification_code = null WHERE email = $2', [hashedPw, email]);
  res.json({ msg: 'Password reset' });
});

module.exports = router;