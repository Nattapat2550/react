import { test, expect } from '@playwright/test';

// 🌟 ฟังก์ชันจัดการ API Mock ระดับ Ultimate หมดปัญหา CORS ชัวร์ๆ
const mockEndpoint = async (page, urlGlob, status, data) => {
  await page.route(urlGlob, async (route) => {
    const request = route.request();
    
    // 1. หาค่า Origin ที่แท้จริง ถ้า Header ไม่มี ให้ดึงจาก URL ของหน้าเว็บที่เทสต์อยู่
    let currentOrigin = request.headers().origin;
    if (!currentOrigin) {
      try {
        currentOrigin = new URL(page.url()).origin;
      } catch (e) {
        currentOrigin = 'http://localhost:5173';
      }
    }
    
    const headers = {
      'Access-Control-Allow-Origin': currentOrigin, // ต้องใช้ Origin เป๊ะๆ ห้ามใช้ '*' เพราะติด withCredentials
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 2. ดักจัดการ Preflight (OPTIONS) ให้ตอบ 200 เสมอ
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers });
      return;
    }

    // 3. ตอบกลับข้อมูลเป็น JSON
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(data),
    });
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // เซ็ตให้หน้าแรกรู้ว่ายังไม่ได้ล็อกอิน
    await mockEndpoint(page, '**/api/users/me', 401, { error: 'Not logged in' });
    
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 1. Mock เพื่อบังคับให้ตอบ Error 401
    await mockEndpoint(page, '**/api/auth/login', 401, { error: 'Invalid credentials' });

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');

    // 2. ส่งฟอร์ม (รอ Response เพื่อความชัวร์)
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/auth/login'));
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // 3. เช็คข้อความบนหน้าจอ
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินสำเร็จ
    await mockEndpoint(page, '**/api/auth/login', 200, {
      token: 'fake-jwt-token',
      user: { id: 1, role: 'user' }
    });

    // Mock ดักไว้ว่าหลังจากล็อกอินสำเร็จ จะดึงข้อมูล User ได้
    await mockEndpoint(page, '**/api/users/me', 200, {
      id: 1, username: 'Test User', role: 'user'
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // ส่งฟอร์มและรอให้ยิง Request เสร็จ
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/auth/login'));
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ตรวจสอบการย้ายหน้า
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});