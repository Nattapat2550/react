import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // รอให้หน้าต่างโหลดเสร็จพร้อมฟอร์ม
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 1. กรอกข้อมูลผิด
    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // 2. กดปุ่ม Login
    await page.locator('button[type="submit"]').click();

    // 3. ⭐️ ใช้ .or() ตรวจสอบข้อความ Error 
    // หาก Backend รันอยู่จะแสดง "Invalid credentials"
    // หาก Backend ปิดอยู่ หรือติด Network Error จะแสดง "Login failed" (ค่า Fallback)
    await expect(
      page.getByText('Invalid credentials', { exact: false })
      .or(page.getByText('Login failed', { exact: false }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // ⭐️ ใช้การ Route โดยตรงเพื่อให้ผ่านพ้น Preflight (OPTIONS) ของ CORS
    await page.route('**/api/auth/login', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.continue(); // ให้ Backend จัดการ Headers เอง
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': route.request().headers().origin || '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, role: 'user' } })
      });
    });

    await page.route('**/api/users/me', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': route.request().headers().origin || '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify({ id: 1, username: 'TestUser', role: 'user' })
      });
    });

    // ใส่ข้อมูลเพื่อทดสอบการเข้าสู่ระบบสำเร็จ
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ตรวจสอบว่าหลังจาก Login สำเร็จ ระบบพากลับไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});