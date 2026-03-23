import { test, expect } from '@playwright/test';

const corsHeaders = { 
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

test.describe('Login Flow & Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // ดัก OPTIONS ทุกตัว
    await page.route('**/*', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
      } else {
        await route.continue();
      }
    });

    // สถานะเริ่มต้น: ยังไม่ได้ Login
    await page.route('**/api/users/me', route => {
      route.fulfill({ status: 401, headers: corsHeaders, json: { error: 'Not logged in' } });
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

    // 🌟 ใช้สัญลักษณ์สากล หรือค้นหาข้อความแบบไม่เป๊ะ (Exact: false)
    await expect(page.getByText('Invalid credentials', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { token: 'fake-jwt-token', user: { id: 1, role: 'user' } }
      });
    });

    // 🌟 1. รอให้ช่องกรอก Email โผล่มาก่อน ค่อยทำอย่างอื่น 
    // (เพื่อยืนยันว่าเราอยู่หน้า /login จริงๆ และ GuestRoute ทำงานจบแล้ว)
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // 🌟 2. ค่อยเปลี่ยน Mock /me ให้เป็น 200 หลังจากโหลดหน้าล็อกอินเสร็จแล้ว
    await page.route('**/api/users/me', route => {
      route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { id: 1, username: 'Test User', role: 'user' } 
      });
    });

    // 3. เริ่มกรอกข้อมูล
    await emailInput.fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    // 4. คลิกแล้วรอให้ URL เปลี่ยน
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});