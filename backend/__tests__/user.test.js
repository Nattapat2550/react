// backend/__tests__/user.test.js
const request = require('supertest');
const app = require('../server.js');
const { setupGlobalMock, setupTestAccounts } = require('./testHelper.js');

describe('👤 User Profile API Tests', () => {
  let userToken;

  beforeAll(async () => {
    setupGlobalMock();
    const accounts = await setupTestAccounts(app);
    userToken = accounts.userToken;
  });

  it('👤 GET /api/users/me - ดึงข้อมูลโปรไฟล์ของตัวเองได้สำเร็จ', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toEqual('user');
  });

  it('✏️ PUT /api/users/me - อัปเดตชื่อผู้ใช้ (Username) สำเร็จ', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'UpdatedNameUser' });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.ok).toBe(true);
  });

  it('🚫 POST /api/users/me/avatar - บล็อกการอัปโหลดไฟล์ที่ไม่ใช่รูปภาพ', async () => {
    const res = await request(app)
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('avatar', Buffer.from('malicious code'), 'malware.exe'); // จำลองไฟล์อันตราย
      
    expect(res.statusCode).toEqual(400); // Bad Request
  });

  it('🗑️ DELETE /api/users/me - ลบบัญชีตัวเองสำเร็จ', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.ok).toBe(true);
  });
});