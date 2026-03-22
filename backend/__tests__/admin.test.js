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
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('🛠️ PUT /api/admin/users/:id - แอดมินปรับสิทธิ์ให้คนอื่นเป็นแอดมินได้', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
      
    expect(res.statusCode).toEqual(200);
  });

  it('🖼️ POST /api/admin/carousel - แอดมินสร้างภาพสไลด์แบนเนอร์ใหม่ได้', async () => {
    const res = await request(app)
      .post('/api/admin/carousel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'New Banner', image_url: 'http://example.com/img.jpg' });
      
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.title).toEqual('New Banner');
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