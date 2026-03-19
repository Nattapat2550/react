const request = require('supertest');
const app = require('../server');
const { setupGlobalMock } = require('./testHelper');

// ดึงตัวแปรจำลองฐานข้อมูลจาก Mock
const mockDb = setupGlobalMock();

describe('Comprehensive System Integration Tests', () => {
  let userToken, adminToken;
  const testUser = { email: 'user@test.com', password: 'Password123!', username: 'User1' };
  const testAdmin = { email: 'admin@test.com', password: 'Password123!', username: 'Admin1' };

  // 🟢 หมวดที่ 1: Authentication & Security
  describe('1. Authentication & Security', () => {
    
    test('AUTH-01: Register new email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testUser.email });
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
    });

    test('AUTH-03: Verify OTP code', async () => {
      // ใน Mock ระบบจะให้ code ผ่านเสมอ
      const res = await request(app)
        .post('/api/auth/verify-code')
        .send({ email: testUser.email, code: '123456' });
      expect(res.status).toBe(200);
    });

    test('AUTH-05: Complete profile & get JWT', async () => {
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .send({ 
          email: testUser.email, 
          username: testUser.username, 
          password: testUser.password 
        });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      userToken = res.body.token; // เก็บ Token ไว้ใช้ต่อ
    });

    test('AUTH-06: Login success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test('AUTH-07: Login fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  // 👤 หมวดที่ 2: User Profile
  describe('2. User Profile Management', () => {
    
    test('USR-02: Get own profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
    });

    test('USR-04: Upload avatar (Base64)', async () => {
      const res = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('avatar', Buffer.from('fake-image-data'), 'test.png');
      expect(res.status).toBe(200);
      expect(res.body.profile_picture_url).toContain('data:image/png;base64');
    });

    test('USR-07: Delete own account', async () => {
      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(204);
    });
  });

  // 👑 หมวดที่ 3: Admin CMS
  describe('3. Admin CMS (Requires Admin Token)', () => {
    
    beforeAll(async () => {
      // สร้าง Admin และดึง Token
      await request(app).post('/api/auth/register').send({ email: testAdmin.email });
      await request(app).post('/api/auth/verify-code').send({ email: testAdmin.email, code: '123' });
      const res = await request(app).post('/api/auth/complete-profile').send({
        email: testAdmin.email, username: testAdmin.username, password: testAdmin.password
      });
      adminToken = res.body.token;
      
      // Manual set role in mock db to admin
      const adminInDb = mockDb.users.find(u => u.email === testAdmin.email);
      if (adminInDb) adminInDb.role = 'admin';
    });

    test('ADM-02: Admin list all users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('ADM-04: Admin create carousel item', async () => {
      const res = await request(app)
        .post('/api/admin/carousel')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'New Slide')
        .field('itemIndex', 1)
        .attach('image', Buffer.from('img'), 'slide.jpg');
      expect(res.status).toBe(201);
    });

    test('ADM-08: Admin update homepage content', async () => {
      const res = await request(app)
        .put('/api/homepage')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_name: 'hero', content: { title: 'Updated Title' } });
      expect(res.status).toBe(200);
    });
  });

  // 📦 หมวดที่ 5: System & Download
  describe('5. System & Downloads', () => {
    
    test('SYS-01: Health check', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('SYS-02: Download Windows file (Proxy)', async () => {
      const res = await request(app).get('/api/download/windows');
      expect(res.status).toBe(200);
      expect(res.header['content-disposition']).toContain('MyAppSetup.exe');
    });

    test('PUB-03: 404 Not Found', async () => {
      const res = await request(app).get('/api/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not found');
    });
  });
});