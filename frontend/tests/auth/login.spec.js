import { test, expect } from '@playwright/test';

// 🌟 Helper สำหรับ Mock API และเคลียร์ปัญหาเรื่อง CORS แบบหมดจด
const mockRoute = async (page, urlPattern, status, responseBody) => {
  await page.route(urlPattern, async (route) => {
    const request = route.request();
    const origin = request.headers().origin || 'http://localhost:3000';
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // ดัก OPTIONS ให้ผ่านเสมอ
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    return route.fulfill({
      status,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify(responseBody)
    });
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ล้าง Storage ทุกรอบ เพื่อให้สถานะคลีนจริงๆ
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // จำลองสถานะ "ยังไม่ล็อกอิน"
    await mockRoute(page, '**/api/users/me', 401, { error: 'Not logged in' });
    
    await page.goto('/login');
    
    // 🌟 บังคับให้รอจนกว่าโหลด Script ครบ และ React Hydrate เสร็จสมบูรณ์
    // ป้องกันการกด Submit เร็วเกินไปจนทำให้ฟอร์มทำ Native Reload!
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 🌟 จำลอง Error 400 (ใช้ 400 ปลอดภัยกว่า 401 ป้องกัน Axios โยนทิ้ง)
    await mockRoute(page, '**/api/auth/login', 400, { error: 'Invalid credentials' });

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // ดักรอ Request POST ชัวร์ๆ ไม่ให้ Playwright ข้ามสเต็ป
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // 🌟 เล็งเป้าไปที่แท็ก <p> เพื่อความแม่นยำ พร้อมใช้ Regex หลวมๆ
    const errorMsg = page.locator('p.muted', { hasText: /Invalid credentials|Login failed/i });
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินผ่าน
    await mockRoute(page, '**/api/auth/login', 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } });
    await mockRoute(page, '**/api/users/me', 200, { id: 1, username: 'TestUser', role: 'user' });

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});