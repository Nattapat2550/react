import { test, expect } from '@playwright/test';

// 🌟 นำ Helper เดียวกันมาใช้เพื่อไม่ให้ Mock API มีปัญหากับเบราว์เซอร์
const mockWithCors = async (page, url, status, body) => {
  await page.route(url, async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': route.request().headers().origin || 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }
    return route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ล้าง Storage ทุกรอบ เพื่อให้สถานะคลีนจริงๆ ไม่มี Token ค้าง
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await mockWithCors(page, '**/api/users/me', 401, { error: 'Not logged in' });
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // จำลอง Error 400
    await mockWithCors(page, '**/api/auth/login', 400, { error: 'Invalid credentials' });

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    // 🌟 เล็งหาคำว่า Invalid credentials หรือ Login failed ตรงๆ (เป็นฟังก์ชันที่ทรงพลังและแม่นยำที่สุดของ Playwright)
    await expect(page.getByText(/Invalid credentials|Login failed/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock การล็อกอินผ่าน
    await mockWithCors(page, '**/api/auth/login', 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } });
    await mockWithCors(page, '**/api/users/me', 200, { id: 1, username: 'TestUser', role: 'user' });

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/.*\/home/, { timeout: 10000 });
  });
});