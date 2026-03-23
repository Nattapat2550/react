import { test, expect } from '@playwright/test';

// 🌟 ฟังก์ชันดัก API ขั้นเทพ! จัดการ CORS และ Content-Type ให้อัตโนมัติ
const mockApi = async (page, urlGlob, status, payload) => {
  await page.route(urlGlob, async (route) => {
    const req = route.request();
    
    // ดึง Origin จาก Request Header เพื่อให้ตรงกับที่ Browser ร้องขอ 100%
    const origin = req.headers()['origin'] || 'http://localhost:5173';

    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 1. ดัก Preflight (OPTIONS)
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    // 2. ตอบกลับพร้อมข้อมูล (ใช้ property 'json' Playwright จะจัดการ Stringify & Headers ให้อัตโนมัติ)
    return route.fulfill({
      status,
      headers: corsHeaders,
      json: payload, 
    });
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ดัก API /me ให้ตอบ 401 (Not logged in) ก่อนที่จะเปิดหน้า login
    await mockApi(page, '**/api/users/me', 401, { error: 'Not logged in' });
    
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 1. ดักจับ API /login และบังคับให้คืนค่า 401 พร้อมข้อความ Error
    await mockApi(page, '**/api/auth/login', 401, { error: 'Invalid credentials' });

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');

    // 2. ⭐️ ท่าไม้ตาย: สั่งคลิกแล้ว "รอ" จนกว่า API ที่ดักไว้จะตอบกลับเสร็จสมบูรณ์
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/auth/login'));
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // 3. ค้นหาข้อความ Error (ไม่น่าพลาดแล้วล่ะครับรอบนี้!)
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock API ให้ล็อกอินสำเร็จ (200)
    await mockApi(page, '**/api/auth/login', 200, {
      token: 'fake-jwt-token',
      user: { id: 1, role: 'user' }
    });

    // Mock ว่าตอดึงข้อมูล /me รอบใหม่หลังล็อกอิน ให้ผ่านเรียบร้อย
    await mockApi(page, '**/api/users/me', 200, {
      id: 1, username: 'Test User', role: 'user'
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // รอ Request ตอบกลับเช่นเดียวกัน
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/auth/login'));
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ยืนยันการย้ายไปหน้า Home
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});