const { callPureApi } = require('../utils/pureApi');

async function createUserByEmail(email) {
  return await callPureApi('/create-user-email', { email });
}
async function findUserByEmail(email) {
  return await callPureApi('/find-user', { email });
}
async function findUserById(id) {
  return await callPureApi('/find-user', { id });
}
async function findUserByOAuth(provider, oauthId) {
  return await callPureApi('/find-user', { provider, oauthId });
}
async function markEmailVerified(_userId) {
  return null;
}
async function setUsernameAndPassword(email, username, password) {
  return await callPureApi('/set-username-password', { email, username, password });
}
async function updateProfile(userId, { username, profilePictureUrl }) {
  return await callPureApi('/admin/users/update', { id: userId, username, profile_picture_url: profilePictureUrl });
}
async function deleteUser(_userId) {
  console.warn('deleteUser not fully implemented via Pure-API yet');
  return null;
}
async function getAllUsers() {
  return await callPureApi('/admin/users') || [];
}
async function storeVerificationCode(userId, code, expiresAt) {
  return await callPureApi('/store-verification-code', { userId, code, expiresAt });
}
async function validateAndConsumeCode(email, code) {
  const result = await callPureApi('/verify-code', { email, code });
  if (!result || (result.ok === false)) {
    return { ok: false, reason: result?.reason || 'error' };
  }
  return { ok: true, userId: result.userId || result.data?.userId };
}
async function setOAuthUser(data) {
  return await callPureApi('/set-oauth-user', data);
}
async function createPasswordResetToken(email, token, expiresAt) {
  return await callPureApi('/create-reset-token', { email, token, expiresAt });
}
async function consumePasswordResetToken(rawToken) {
  return await callPureApi('/consume-reset-token', { token: rawToken });
}
async function setPassword(userId, newPassword) {
  return await callPureApi('/set-password', { userId, newPassword });
}

module.exports = {
  createUserByEmail, findUserByEmail, findUserById, findUserByOAuth,
  markEmailVerified, setUsernameAndPassword, updateProfile, deleteUser,
  getAllUsers, storeVerificationCode, validateAndConsumeCode, setOAuthUser,
  createPasswordResetToken, consumePasswordResetToken, setPassword
};
