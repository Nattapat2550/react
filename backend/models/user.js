// backend/models/user.js
const { callPureApi } = require('../utils/pureApi');

async function createUserByEmail(email) {
  return await callPureApi('/create-user-email', 'POST', { email });
}

async function findUserByEmail(email) {
  return await callPureApi('/find-user', 'POST', { email });
}

async function findUserById(id) {
  return await callPureApi('/find-user', 'POST', { id });
}

async function findUserByOAuth(provider, oauthId) {
  return await callPureApi('/find-user', 'POST', { provider, oauthId });
}

async function markEmailVerified(userId) {
  return null; // Pure-API จัดการให้แล้ว
}

async function setUsernameAndPassword(email, username, password) {
  return await callPureApi('/set-username-password', 'POST', { email, username, password });
}

async function updateProfile(userId, { username, profilePictureUrl }) {
  return await callPureApi('/admin/users/update', 'POST', { 
    id: userId, 
    username, 
    profile_picture_url: profilePictureUrl 
  });
}

async function deleteUser(userId) {
  // รองรับในอนาคต
  console.warn('deleteUser via API not fully implemented');
}

async function getAllUsers() {
  return await callPureApi('/admin/users', 'GET') || [];
}

async function storeVerificationCode(userId, code, expiresAt) {
  return await callPureApi('/store-verification-code', 'POST', { userId, code, expiresAt });
}

async function validateAndConsumeCode(email, code) {
  const result = await callPureApi('/verify-code', 'POST', { email, code });
  if (!result || result.ok === false) {
    return { ok: false, reason: result?.reason || 'error' };
  }
  return { ok: true, userId: result.userId || result.data?.userId };
}

async function setOAuthUser(data) {
  return await callPureApi('/set-oauth-user', 'POST', data);
}

async function createPasswordResetToken(email, token, expiresAt) {
  return await callPureApi('/create-reset-token', 'POST', { email, token, expiresAt });
}

async function consumePasswordResetToken(rawToken) {
  return await callPureApi('/consume-reset-token', 'POST', { token: rawToken });
}

async function setPassword(userId, newPassword) {
  return await callPureApi('/set-password', 'POST', { userId, newPassword });
}

module.exports = {
  createUserByEmail, findUserByEmail, findUserById, findUserByOAuth,
  markEmailVerified, setUsernameAndPassword, updateProfile, deleteUser,
  getAllUsers, storeVerificationCode, validateAndConsumeCode, setOAuthUser,
  createPasswordResetToken, consumePasswordResetToken, setPassword
};