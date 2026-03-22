// backend/__tests__/login.test.js
const request = require('supertest');
const app = require('../server.js');
const { setupGlobalMock, setupTestAccounts } = require('./testHelper.js');

describe('🔑 Login API Tests', () => {
  let testUserConfig;

  beforeAll(async () => {
    setupGlobalMock();
    const accounts = await setupTestAccounts(app);
    testUserConfig = accounts.testUserConfig; // ข้อมูล User ที่สร้างจาก helper
  });

  it('✅ POST /api/auth/login - ล็อกอินสำเร็จเมื่ออีเมลและรหัสผ่านถูกต้อง', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserConfig.email, password: testUserConfig.password });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(testUserConfig.email);
  });

  it('❌ POST /api/auth/login - ล็อกอินไม่สำเร็จ (401) ถ้ารหัสผ่านผิด', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserConfig.email, password: 'WrongPassword123!' });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBeDefined();
  });

  it('❌ POST /api/auth/login - ล็อกอินไม่สำเร็จ (404/401) ถ้าไม่มีอีเมลในระบบ', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@example.com', password: 'Password123!' });
    
    // ขึ้นอยู่กับว่า Backend ของคุณตอบ 401 หรือ 404 สำหรับ User not found
    expect([401, 404]).toContain(res.statusCode); 
    expect(res.body.error).toBeDefined();
  });
});