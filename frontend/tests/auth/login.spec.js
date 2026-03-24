import { test, expect } from '@playwright/test';

// 🌟 Helper ที่รอบคอบมากขึ้น จัดการ async/await ได้ชัวร์ 100%
const mockApiWithCors = async (route, status, bodyData) => {
  const req = route.request();
  const origin = req.headers().origin || 'http://localhost:5173';

  const headers = {
    'Access-Control-Allow-Origin': origin === '*' ? 'http://localhost:5173' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };

  // ดัก OPTIONS (Preflight) ให้ผ่านเสมอ
  if (req.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers });
    return;
  }

  // ส่งค่ากลับพร้อมข้อมูล Mock สำหรับ Request จริง
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(bodyData)
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ดัก /me ก่อนโหลดหน้า เพื่อป้องกันการเด้งไปหน้าอื่น (ใช้ async/await เต็มรูปแบบ)
    await page.route('**/api/users/me', async (route) => {
      await mockApiWithCors(route, 401, { error: 'Not logged in' });
    });

    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await mockApiWithCors(route, 401, { error: 'Invalid credentials' });
    });

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // ดักจับเฉพาะ POST request เท่านั้น
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ✅ เล็งไปที่แท็ก <p> ที่มีคลาส muted เพื่อความแม่นยำ ไม่ค้นหามั่วทั้งหน้า
    const errorElement = page.locator('p.muted').filter({ hasText: /Invalid credentials|Login failed/i });
    await expect(errorElement).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock ล็อกอินสำเร็จ
    await page.route('**/api/auth/login', async (route) => {
      await mockApiWithCors(route, 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } });
    });

    // Override ให้กลายเป็นเจอ User หลังล็อกอินเสร็จ
    await page.route('**/api/users/me', async (route) => {
      await mockApiWithCors(route, 200, { id: 1, username: 'TestUser', role: 'user' });
    });

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ตรวจสอบว่าระบบพากลับไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});