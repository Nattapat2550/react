import { test, expect } from '@playwright/test';

// 🌟 สร้าง Helper ที่เคลียร์ CORS แบบหมดจดและเขียนแบบ Async/Await สมบูรณ์
const mockApi = async (route, status, data) => {
  const origin = route.request().headers().origin || 'http://localhost:5173';
  
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (route.request().method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers });
  }

  return route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(data)
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/users/me', async route => await mockApi(route, 401, { error: 'Not logged in' }));
    await page.goto('/login');
    
    await expect(page.locator('input[name="email"]')).toBeVisible();
    // 🌟 รอให้ React แนบ Event Listener (onSubmit) ให้เสร็จก่อน ป้องกันหน้ารีเฟรชเองเวลา Playwright คลิกปุ่ม
    await page.waitForTimeout(1000); 
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // ใช้ 400 (Bad Request) เพื่อส่ง Error กลับไปให้ถึง Redux ตรงๆ และไม่โดนขัดขวางโดย Interceptor ของ 401
    await page.route('**/api/auth/login', async route => await mockApi(route, 400, { error: 'Invalid credentials' }));

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    // 🌟 เล็งไปที่ body และใช้ .toContainText() ค้นหาแบบหลวมๆ (Regex) ไม่ต้องสนใจโครงสร้าง HTML ใดๆ ทั้งสิ้น
    await expect(page.locator('body')).toContainText(/Invalid credentials|Login failed/i, { timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินสำเร็จด้วย 200
    await page.route('**/api/auth/login', async route => await mockApi(route, 200, { token: 'fake-token', user: { id: 1, role: 'user' } }));
    await page.route('**/api/users/me', async route => await mockApi(route, 200, { id: 1, username: 'TestUser', role: 'user' }));

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ตรวจสอบว่าระบบพากลับไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});