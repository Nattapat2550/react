import { test, expect } from '@playwright/test';

// 🌟 1. อนุญาต Origin ปัจจุบัน (ห้ามใช้ '*') และเปิด Allow-Credentials
const corsHeaders = { 
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

test.describe('Login Flow & Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // กำหนดให้เริ่มต้นมายังไม่ได้ล็อกอิน (401) เพื่อให้ GuestRoute ยอมให้อยู่หน้า /login
    await page.route('**/api/users/me', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders });
      }
      return route.fulfill({ status: 401, headers: corsHeaders, json: { error: 'Not logged in' } });
    });

    await page.goto('/login');

    // 🌟 2. รอให้ช่องกรอก Email ปรากฏขึ้นมาก่อน เพื่อการันตีว่าเราอยู่หน้า login จริงๆ
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // จำลองการล็อกอินผิดพลาด (401)
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders });
      }
      return route.fulfill({
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
    // จำลองการล็อกอินสำเร็จ (200)
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders });
      }
      return route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { token: 'fake-jwt-token', user: { id: 1, role: 'user' } }
      });
    });

    // 🌟 3. กรอกข้อมูลให้เสร็จก่อน
    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // 🌟 4. ค่อยมาเปลี่ยน Mock ของ /me ให้เป็น 200 ก่อนจะกดปุ่ม Submit 
    // เพื่อให้รอบถัดไปที่แอปเช็คสถานะ มันจะมองเห็นว่าเราล็อกอินแล้ว
    await page.route('**/api/users/me', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders });
      }
      return route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { id: 1, username: 'Test User', role: 'user' } 
      });
    });
    
    // กดล็อกอิน
    await page.locator('button[type="submit"]').click();
    
    // ยืนยันว่า Redirect ไปหน้า /home
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});