// react/backend/models/user.js
const { callPureApi } = require('../utils/pureApi');

/**
 * สร้าง User ใหม่ด้วย Email (ยังไม่ Verify)
 */
async function createUserByEmail(email) {
  return await callPureApi('/create-user-email', { email });
}

/**
 * ค้นหา User ด้วย Email
 */
async function findUserByEmail(email) {
  return await callPureApi('/find-user', { email });
}

/**
 * ค้นหา User ด้วย ID
 */
async function findUserById(id) {
  return await callPureApi('/find-user', { id });
}

/**
 * ค้นหา User ด้วย OAuth Provider
 */
async function findUserByOAuth(provider, oauthId) {
  return await callPureApi('/find-user', { provider, oauthId });
}

/**
 * เปลี่ยนสถานะ Email Verified
 */
async function markEmailVerified(userId) {
  // Pure-API จัดการให้แล้ว
  return null;
}

/**
 * ตั้ง Username และ Password
 */
async function setUsernameAndPassword(email, username, password) {
  return await callPureApi('/set-username-password', { email, username, password });
}

/**
 * อัปเดตข้อมูล Profile
 */
async function updateProfile(userId, { username, profilePictureUrl }) {
  // ใช้ Endpoint Admin Update ของ Pure-API
  return await callPureApi('/admin/users/update', { 
    id: userId, 
    username, 
    profile_picture_url: profilePictureUrl 
  });
}

/**
 * ลบ User
 */
async function deleteUser(userId) {
  // รองรับการลบ user ถ้า pure-api มี endpoint นี้
  return await callPureApi('/delete-user', { id: userId });
}

/**
 * ดึง User ทั้งหมด (สำหรับ Admin)
 */
async function getAllUsers() {
  return await callPureApi('/admin/users') || [];
}

/**
 * บันทึก Verification Code
 */
async function storeVerificationCode(userId, code, expiresAt) {
  return await callPureApi('/store-verification-code', { userId, code, expiresAt });
}

/**
 * ตรวจสอบและใช้ Verification Code
 */
async function validateAndConsumeCode(email, code) {
  const result = await callPureApi('/verify-code', { email, code });
  if (!result || (result.ok === false)) {
    return { ok: false, reason: result?.reason || 'error' };
  }
  return { ok: true, userId: result.userId || result.data?.userId };
}

/**
 * สร้างหรืออัปเดต User จาก OAuth (Google)
 */
async function setOAuthUser(data) {
  return await callPureApi('/set-oauth-user', data);
}

/**
 * สร้าง Token สำหรับ Reset Password
 */
async function createPasswordResetToken(email, token, expiresAt) {
  return await callPureApi('/create-reset-token', { email, token, expiresAt });
}

/**
 * ตรวจสอบและใช้ Token Reset Password
 */
async function consumePasswordResetToken(rawToken) {
  return await callPureApi('/consume-reset-token', { token: rawToken });
}

/**
 * เปลี่ยนรหัสผ่านใหม่
 */
async function setPassword(userId, newPassword) {
  return await callPureApi('/set-password', { userId, newPassword });
}

// Admin Update User (เพิ่ม function นี้เพื่อให้ routes/admin.js เรียกใช้ได้สะดวก)
async function adminUpdateUser(id, payload) {
    return await callPureApi('/admin/users/update', 'POST', { id, ...payload });
}

module.exports = {
  createUserByEmail, findUserByEmail, findUserById, findUserByOAuth,
  markEmailVerified, setUsernameAndPassword, updateProfile, deleteUser,
  getAllUsers, storeVerificationCode, validateAndConsumeCode, setOAuthUser,
  createPasswordResetToken, consumePasswordResetToken, setPassword,
  adminUpdateUser
};