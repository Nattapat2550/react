// backend/models/user.js
// IMPORTANT: This projectreact backend MUST NOT access PostgreSQL directly.
// Instead, it calls the dedicated DB-only layer (pure-api) server-to-server.

const { post, get } = require('../utils/pureApiClient');

/**
 * Pure API internal endpoints (recommended):
 * - /api/internal/auth/register
 * - /api/internal/auth/login
 * - /api/internal/auth/verify
 * - /api/internal/auth/resend
 * - /api/internal/auth/forgot
 * - /api/internal/auth/reset
 * - /api/internal/users/me
 * - /api/internal/users/by-email
 * - /api/internal/users/update
 * - /api/internal/admin/users/update
 *
 * NOTE: The actual endpoint paths must exist in pure-api. These are aligned to the docker-style separation:
 * projectreact backend acts as "backend" and pure-api is the only DB access.
 */

// Register (create user + verification code)
async function createUser(username, email, hashedPassword) {
  return post('/api/internal/auth/register', {
    username,
    email,
    password_hash: hashedPassword,
  });
}

// Login (validate password hash is done in this backend, so pure-api should return user by email)
async function getUserByEmail(email) {
  return post('/api/internal/users/by-email', { email });
}

// Find user by id (profile)
async function getUserById(id) {
  return post('/api/internal/users/me', { id });
}

// Set email verified
async function verifyUser(email) {
  return post('/api/internal/auth/verify', { email });
}

// Create verification code (for resend)
async function createVerificationCode(email, code, expiresAt) {
  return post('/api/internal/auth/resend', {
    email,
    code,
    expires_at: expiresAt,
  });
}

// Password reset token creation
async function createPasswordResetToken(email, token, expiresAt) {
  return post('/api/internal/auth/forgot', {
    email,
    token,
    expires_at: expiresAt,
  });
}

// Get password reset token (validate)
async function getPasswordResetToken(token) {
  return post('/api/internal/auth/reset/get', { token });
}

// Update password by email (after token validation)
async function updatePassword(email, hashedPassword) {
  return post('/api/internal/auth/reset', {
    email,
    password_hash: hashedPassword,
  });
}

// Google login helpers (upsert user by google_id)
async function findUserByGoogleId(googleId) {
  return post('/api/internal/auth/google/find', { google_id: googleId });
}

async function createGoogleUser({ username, email, googleId, avatarUrl }) {
  return post('/api/internal/auth/google/create', {
    username,
    email,
    google_id: googleId,
    avatar_url: avatarUrl,
  });
}

// Update user profile (non-admin)
async function updateUserProfile(id, payload) {
  return post('/api/internal/users/update', { id, ...payload });
}

// Admin update user
async function adminUpdateUser(id, payload) {
  return post('/api/internal/admin/users/update', { id, ...payload });
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  verifyUser,
  createVerificationCode,
  createPasswordResetToken,
  getPasswordResetToken,
  updatePassword,
  findUserByGoogleId,
  createGoogleUser,
  updateUserProfile,
  adminUpdateUser,
};
