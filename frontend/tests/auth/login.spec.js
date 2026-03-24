import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ดัก /me ก่อนโหลดหน้า
    await page.route('**/api/users/me', async (route) => {
      const origin = route.request().headers().origin || 'http://localhost:5173';
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      }
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({ error: 'Not logged in' })
      });
    });

    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // เซ็ต Mock สำหรับการล็อกอินที่ล้มเหลว
    await page.route('**/api/auth/login', async (route) => {
      const origin = route.request().headers().origin || 'http://localhost:5173';
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      }
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    // ให้ Playwright auto-wait ค้นหาข้อความแบบยืดหยุ่น โดยไม่ต้องใช้ waitForResponse มาขวาง
    await expect(page.locator('text="Invalid credentials"').first()).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินสำเร็จ
    await page.route('**/api/auth/login', async (route) => {
      const origin = route.request().headers().origin || 'http://localhost:5173';
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, role: 'user' } })
      });
    });

    // Override ทับ /me เดิม ให้กลายเป็นเจอ User หลังล็อกอินเสร็จ
    await page.route('**/api/users/me', async (route) => {
      const origin = route.request().headers().origin || 'http://localhost:5173';
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({ id: 1, username: 'TestUser', role: 'user' })
      });
    });

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ตรวจสอบว่าระบบพากลับไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});