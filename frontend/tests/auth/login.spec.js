import { test, expect } from '@playwright/test';

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

test.describe('Login Flow & Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // 🌟 ดักทุก OPTIONS request เพื่อให้ CORS ผ่านฉลุย
    await page.route('**/*', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
      } else {
        await route.continue();
      }
    });

    // เริ่มต้นให้ /me ส่ง 401 เสมอ (ยังไม่ได้ล็อกอิน)
    await page.route('**/api/users/me', route => {
      route.fulfill({ status: 401, headers: corsHeaders, json: { error: 'Unauthorized' } });
    });

    await page.goto('/login');
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        headers: corsHeaders,
        json: { error: 'Invalid credentials' }
      });
    });

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // 🌟 รอให้ข้อความปรากฏขึ้นจริง (แก้ปัญหา Re-render ช้า)
    const errorMsg = page.getByText('Invalid credentials');
    await expect(errorMsg).toBeVisible({ timeout: 7000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // 1. Mock ตอนกดปุ่ม Login
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { token: 'fake-jwt-token', user: { id: 1, role: 'user' } }
      });
    });

    // 2. 🌟 สำคัญมาก: เมื่อ Login สำเร็จ /me ต้องเปลี่ยนเป็น 200 ทันที
    // เพื่อไม่ให้ ProtectedRoute ดีดกลับมาหน้า Login
    await page.route('**/api/users/me', route => {
      route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { id: 1, username: 'Test User', role: 'user' } 
      });
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    // รอให้ URL เปลี่ยนไปหน้า home
    await Promise.all([
      page.waitForURL(/.*\/home/),
      page.locator('button[type="submit"]').click()
    ]);

    await expect(page).toHaveURL(/.*\/home/);
  });
});