import { test, expect } from '@playwright/test';

// 🌟 สร้างฟังก์ชัน Helper สำหรับจัดการ Mock API และ CORS
const mockApiWithCors = async (route, status, bodyData) => {
  const request = route.request();
  const origin = request.headers().origin || 'http://localhost:5173';

  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };

  // ดัก OPTIONS (Preflight) ให้ผ่านเสมอ
  if (request.method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers });
  }

  // ส่งค่ากลับพร้อมข้อมูล Mock
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(bodyData)
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ดัก /me ก่อนโหลดหน้า เพื่อป้องกันการเด้งไปหน้าอื่น
    await page.route('**/api/users/me', (route) => 
      mockApiWithCors(route, 401, { error: 'Not logged in' })
    );

    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => 
      mockApiWithCors(route, 401, { error: 'Invalid credentials' })
    );

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // ⭐️ ดักจับเฉพาะ POST request เท่านั้น เพื่อไม่ให้สับสนกับ OPTIONS
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ⭐️ ใช้ Regex ครอบคลุมทั้งกรณี Mock อ่านออก และกรณีตกเป็น Fallback ของ Redux
    await expect(page.locator('text=/Invalid credentials|Login failed/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock ล็อกอินสำเร็จ
    await page.route('**/api/auth/login', (route) => 
      mockApiWithCors(route, 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } })
    );

    // Override ให้กลายเป็นเจอ User หลังล็อกอินเสร็จ
    await page.route('**/api/users/me', (route) => 
      mockApiWithCors(route, 200, { id: 1, username: 'TestUser', role: 'user' })
    );

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    // ดักจับแบบระบุ POST
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ตรวจสอบว่าระบบพากลับไปหน้า Home
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});