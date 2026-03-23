import { test, expect } from '@playwright/test';

// 🌟 Helper Function สำหรับ Mock API แบบข้าม CORS 100%
const fulfillWithCors = async (route, status, data) => {
  const reqHeaders = route.request().headers();
  // ดึง origin จาก request ถ้าไม่มีให้ใช้ wildcard (เพื่อเลี่ยง CORS)
  const origin = reqHeaders.origin || '*';

  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  };

  // ดัก Preflight (OPTIONS)
  if (route.request().method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers });
  }

  // ส่งกลับเป็น application/json ผ่าน Playwright options โดยตรง
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(data),
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // 1. ตั้งค่าเริ่มต้นให้ Mock API /me ตอบว่า "ยังไม่ล็อกอิน (401)"
    await page.route('**/api/users/me', (route) => fulfillWithCors(route, 401, { error: 'Not logged in' }));
    
    await page.goto('/login');
    
    // 2. รอให้หน้าเว็บ Render ช่องกรอกอีเมลขึ้นมาก่อนเสมอ
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 3. Mock ให้ตอบ 401 Invalid credentials
    await page.route('**/api/auth/login', (route) => fulfillWithCors(route, 401, { error: 'Invalid credentials' }));

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // 4. ค้นหาข้อความ Error 
    await expect(page.getByText('Invalid credentials', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock การล็อกอินให้สำเร็จ
    await page.route('**/api/auth/login', (route) => fulfillWithCors(route, 200, {
      token: 'fake-jwt-token',
      user: { id: 1, role: 'user' }
    }));

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // 5. เมื่อคลิก Submit ให้จำลองว่าเราล็อกอินแล้ว (/me ตอบ 200) เพื่อให้ระบบทำการ Redirect
    await page.route('**/api/users/me', (route) => fulfillWithCors(route, 200, {
      id: 1, username: 'Test User', role: 'user'
    }));
    
    await page.locator('button[type="submit"]').click();
    
    // ตรวจสอบว่าเปลี่ยนหน้าไปที่ Home จริงๆ
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});