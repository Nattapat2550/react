const api = require('../config/api');

async function createUserByEmail(email) {
  const { data } = await api.post('/api/internal/create-user-email', { email });
  return data.data;
}

async function findUserByEmail(email) {
  const { data } = await api.post('/api/internal/find-user', { email });
  return data.data;
}

async function findUserById(id) {
  const { data } = await api.post('/api/internal/find-user', { id });
  return data.data;
}

async function findUserByOAuth(provider, oauthId) {
  const { data } = await api.post('/api/internal/find-user', { provider, oauthId });
  return data.data;
}

async function setUsernameAndPassword(email, username, password) {
  const { data } = await api.post('/api/internal/set-username-password', { email, username, password });
  return data.data;
}

async function updateProfile(userId, { username, profilePictureUrl }) {
  // ใช้ endpoint admin update เพื่อแก้ไขข้อมูล
  const { data } = await api.post('/api/internal/admin/users/update', {
    id: userId,
    username,
    profile_picture_url: profilePictureUrl
  });
  return data.data;
}

async function deleteUser(userId) {
  await api.post('/api/internal/delete-user', { id: userId });
}

async function getAllUsers() {
  const { data } = await api.get('/api/internal/admin/users');
  return data.data;
}

async function adminUpdateUser(id, payload) {
  const { data } = await api.post('/api/internal/admin/users/update', {
    id,
    ...payload
  });
  return data.data;
}

async function storeVerificationCode(userId, code, expiresAt) {
  const { data } = await api.post('/api/internal/store-verification-code', { userId, code, expiresAt });
  return data.ok;
}

async function validateAndConsumeCode(email, code) {
  const { data } = await api.post('/api/internal/verify-code', { email, code });
  return data;
}

async function setOAuthUser(payload) {
  const { data } = await api.post('/api/internal/set-oauth-user', payload);
  return data.data;
}

async function createPasswordResetToken(email, token, expiresAt) {
  const { data } = await api.post('/api/internal/create-reset-token', { email, token, expiresAt });
  return data.data;
}

async function consumePasswordResetToken(token) {
  const { data } = await api.post('/api/internal/consume-reset-token', { token });
  return data.data;
}

async function setPassword(userId, newPassword) {
  const { data } = await api.post('/api/internal/set-password', { userId, newPassword });
  return data.data;
}

// ฟังก์ชัน markEmailVerified ไม่จำเป็นต้องใช้แล้ว เพราะ Pure API จัดการให้ใน process อื่น
function markEmailVerified() { return null; }

module.exports = {
  createUserByEmail, findUserByEmail, findUserById, findUserByOAuth,
  markEmailVerified, setUsernameAndPassword, updateProfile, deleteUser,
  getAllUsers, storeVerificationCode, validateAndConsumeCode, setOAuthUser,
  createPasswordResetToken, consumePasswordResetToken, setPassword,
  adminUpdateUser // เพิ่ม export สำหรับ route admin
};