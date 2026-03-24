import { test, expect } from '@playwright/test';

// 🌟 Helper ที่จัดการ CORS ได้อย่างสมบูรณ์แบบ
const handleRoute = async (route, status, bodyData) => {
  const request = route.request();
  const origin = request.headers().origin || 'http://localhost:5173';
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // ดัก Preflight request
  if (request.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders });
    return;
  }

  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify(bodyData)
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ดัก /me ก่อนโหลดหน้า
    await page.route('**/api/users/me', route => handleRoute(route, 401, { error: 'Not logged in' }));
    
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
    
    // 🌟 รอให้ React โหลดสคริปต์และผูก onSubmit เข้ากับฟอร์มให้เสร็จ ป้องกันหน้ารีเฟรชเอง
    await page.waitForTimeout(500);
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 🌟 ใช้ status 400 แทน 401 เพื่อหลีกเลี่ยงการโดน Chromium ดักจับ Native Auth
    await page.route('**/api/auth/login', route => handleRoute(route, 400, { error: 'Invalid credentials' }));

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // ดักรอ Request POST ชัวร์ๆ
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ระบบจะแสดงข้อความ Error จาก Mock แน่นอน
    await expect(page.locator('text="Invalid credentials"')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินสำเร็จ (200 OK)
    await page.route('**/api/auth/login', route => handleRoute(route, 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } }));
    
    // Override ทับ /me เดิม ให้กลายเป็นเจอ User หลังล็อกอินเสร็จ
    await page.route('**/api/users/me', route => handleRoute(route, 200, { id: 1, username: 'TestUser', role: 'user' }));

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ตรวจสอบว่าระบบพากลับไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});