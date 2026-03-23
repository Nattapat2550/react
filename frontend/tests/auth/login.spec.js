import { test, expect } from '@playwright/test';

// 🌟 Helper Function สำหรับ Mock API ให้ผ่าน CORS อย่างสมบูรณ์แบบ
const fulfillWithCors = async (route, status, data) => {
  const request = route.request();
  const reqHeaders = request.headers();
  
  // แกะ Origin จาก Header จริงๆ (เผื่อ Vite รันพอร์ตอื่นที่ไม่ใช่ 3000)
  let origin = reqHeaders.origin || reqHeaders.referer;
  if (origin) {
    origin = new URL(origin).origin; // แปลงให้อยู่ในรูป http://localhost:xxxx เสมอ
  } else {
    origin = 'http://localhost:3000'; // Fallback
  }
  
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json' // บังคับให้ Axios มองว่าเป็น JSON
  };

  // ดัก Preflight (OPTIONS)
  if (request.method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers });
  }

  // ส่งค่ากลับพร้อม Headers ที่ถูกต้อง
  return route.fulfill({
    status,
    headers,
    body: JSON.stringify(data)
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // 1. ใช้ Regex (/.+\/api\/.../) เพื่อดัก Request ได้แม่นยำ 100% ในทุก Base URL
    await page.route(/.+\/api\/users\/me/, (route) => fulfillWithCors(route, 401, { error: 'Not logged in' }));
    
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 2. Mock ให้ตอบ 401 Invalid credentials
    await page.route(/.+\/api\/auth\/login/, (route) => fulfillWithCors(route, 401, { error: 'Invalid credentials' }));

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');

    // 3. ⭐️ ใช้ Promise.all เพื่อ "รอ" ให้ Request /login ทำงานจนจบหลังจากคลิก
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/login')),
      page.locator('button[type="submit"]').click()
    ]);

    // 4. ค้นหาข้อความ Error บนหน้าจอ
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock การล็อกอินให้สำเร็จ
    await page.route(/.+\/api\/auth\/login/, (route) => fulfillWithCors(route, 200, {
      token: 'fake-jwt-token',
      user: { id: 1, role: 'user' }
    }));

    // Mock ว่าพอล็อกอินเสร็จ /me จะดึงข้อมูลได้แล้ว
    await page.route(/.+\/api\/users\/me/, (route) => fulfillWithCors(route, 200, {
      id: 1, username: 'Test User', role: 'user'
    }));

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // ⭐️ รอให้ Request ตอบกลับมาเรียบร้อยก่อนเสมอ
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/login')),
      page.locator('button[type="submit"]').click()
    ]);
    
    // ตรวจสอบว่าเปลี่ยนหน้าไปที่ Home
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});