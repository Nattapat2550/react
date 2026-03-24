import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ล้าง Storage เพื่อไม่ให้ State จากเทสต์อื่นเข้ามากวน
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // จำลองสถานะยังไม่ได้ล็อกอิน (ดัก OPTIONS สำหรับ CORS ด้วย)
    await page.route('*/**/api/users/me', async (route) => {
      const req = route.request();
      const origin = req.headers().origin || 'http://localhost:3000';
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers });
      }
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not logged in' }),
        headers
      });
    });

    await page.goto('/login');
    
    // 🌟🌟🌟 หัวใจสำคัญ: รอกระทั่งปุ่ม Login พร้อมกด (Redux ทำ checkAuthStatus เสร็จแล้ว)
    // จุดนี้คือตัวการหลักที่ทำให้เทสต์พัง เพราะ Playwright รีบกดตอนปุ่มยังเป็น disabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // Mock รหัส 400 Bad Request ป้องกันเบราว์เซอร์ตีความ 401 ผิดพลาด
    await page.route('*/**/api/auth/login', async (route) => {
      const req = route.request();
      const origin = req.headers().origin || 'http://localhost:3000';
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers });
      }
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
        headers
      });
    });

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // 🌟 ดักรอให้ POST Request ทำงานและตอบกลับให้เสร็จ 100% ก่อนเช็คหน้าจอ
    const resPromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    await resPromise;

    // ค้นหาข้อความแบบยืดหยุ่น การันตีว่าหาเจอแน่นอน
    await expect(page.locator('text=/Invalid credentials|Login failed/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock ล็อกอินผ่านฉลุย
    await page.route('*/**/api/auth/login', async (route) => {
      const req = route.request();
      const origin = req.headers().origin || 'http://localhost:3000';
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, role: 'user', username: 'TestUser' } }),
        headers
      });
    });

    // 🌟 ต้อง Mock /me ด้วย เพราะหลังล็อกอินเสร็จ Router จะบังคับเรียกเช็คอีกรอบ!
    await page.route('*/**/api/users/me', async (route) => {
      const req = route.request();
      const origin = req.headers().origin || 'http://localhost:3000';
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, role: 'user', username: 'TestUser' }),
        headers
      });
    });

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    const resPromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    await resPromise;

    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});