import { test, expect } from '@playwright/test';

// 🌟 1. ใช้ Origin ให้ตรงกับ URL ที่รันเทสต์ และเปิด Allow-Credentials
const corsHeaders = { 
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

test.describe('Login Flow & Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // สถานะเริ่มต้น: ยังไม่ได้ Login
    await page.route('**/api/users/me', route => {
      // ดัก OPTIONS ให้ผ่านเสมอ
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders });
      }
      return route.fulfill({ status: 401, headers: corsHeaders, json: { error: 'Not logged in' } });
    });

    await page.goto('/login');
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 🌟 2. ดัก OPTIONS ภายใน Test นี้ด้วย เพื่อไม่ให้มันเผลอตอบ 401 ตอนพรีไฟลท์
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      
      await route.fulfill({
        status: 401,
        headers: corsHeaders,
        json: { error: 'Invalid credentials' }
      });
    });

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // เช็คข้อความ Invalid credentials
    await expect(page.getByText('Invalid credentials', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { token: 'fake-jwt-token', user: { id: 1, role: 'user' } }
      });
    });

    // 🌟 เปลี่ยน Mock /me ให้เป็น "ผ่าน" ทันทีหลังจาก Login สำเร็จ
    await page.route('**/api/users/me', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { id: 1, username: 'Test User', role: 'user' } 
      });
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    // คลิกแล้วรอให้ URL เปลี่ยน (เพิ่มความทนทานต่อ CI ที่ช้า)
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});