// backend/__tests__/admin.test.js
const request = require('supertest');
const app = require('../server.js');
const { setupGlobalMock, setupTestAccounts } = require('./testHelper.js');

describe('🛡️ Admin & CMS API Tests', () => {
  let adminToken, testUserId;

  beforeAll(async () => {
    setupGlobalMock();
    const accounts = await setupTestAccounts(app);
    adminToken = accounts.adminToken;
    testUserId = accounts.testUserId;
  });

  it('📋 GET /api/admin/users - แอดมินดูรายชื่อสมาชิกทั้งหมดได้', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.statusCode).toEqual(200);
    // ✅ แก้ไข: ข้อมูลที่ได้กลับมาเป็น Array ตรงๆ ไม่ได้ครอบด้วย res.body.users
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('🛠️ PUT /api/admin/users/:id - แอดมินปรับสิทธิ์ให้คนอื่นเป็นแอดมินได้', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
      
    expect(res.statusCode).toEqual(200);
  });

  it('🖼️ POST /api/admin/carousel - แอดมินสร้างภาพสไลด์แบนเนอร์ใหม่ได้', async () => {
    const mockImageBuffer = Buffer.from('mock image content');
    
    // ✅ แก้ไข: API บังคับแนบไฟล์ (multer) ต้องส่งแบบ multipart/form-data
    const res = await request(app)
      .post('/api/admin/carousel')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'New Banner')
      .attach('image', mockImageBuffer, 'banner.jpg');
      
    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toEqual('New Banner');
  });

  it('📝 PUT /api/homepage - แอดมินแก้ไขข้อความส่วน Hero ได้', async () => {
    const res = await request(app)
      .put('/api/homepage')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ section_name: 'hero', content: { title: 'Welcome to New Site' } });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.ok).toBe(true);
  });
});