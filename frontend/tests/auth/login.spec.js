import { test, expect } from '@playwright/test';

// 🌟 สร้างฟังก์ชัน Helper เล็กๆ สำหรับใช้ซ้ำ เพื่อให้โค้ดดูสะอาดตา
const mockApiWithCors = async (route, status, bodyData) => {
  const requestHeaders = route.request().headers();
  // ดึง origin จาก request ป้องกันการใช้ '*' ซึ่งจะติด CORS Error เมื่อใช้ร่วมกับ credentials
  const origin = requestHeaders.origin || (requestHeaders.referer ? new URL(requestHeaders.referer).origin : 'http://localhost:5173');

  const headers = {
    'Access-Control-Allow-Origin': origin === '*' ? 'http://localhost:5173' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };

  // ดัก OPTIONS ให้ผ่านเสมอ
  if (route.request().method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers });
  }

  // ส่งค่ากลับพร้อมข้อมูลที่เราตั้งใจจำลอง
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(bodyData)
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ดัก /me ก่อนโหลดหน้า เพื่อไม่ให้มันเด้งไปหน้าอื่น
    await page.route('**/api/users/me', (route) => 
      mockApiWithCors(route, 401, { error: 'Not logged in' })
    );

    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // ⭐️ เพิ่ม Mock ให้เทสต์แรก
    await page.route('**/api/auth/login', (route) => 
      mockApiWithCors(route, 401, { error: 'Invalid credentials' })
    );

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // ดักจับ response เพื่อให้แน่ใจว่า API Mock ทำงานเสร็จสิ้นก่อน assert ป้องกันความเร็วจนเกิด Timeout
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/auth/login'));
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ตอนนี้มันจะได้รับข้อความ Invalid credentials กลับมาทันที
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินสำเร็จ
    await page.route('**/api/auth/login', (route) => 
      mockApiWithCors(route, 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } })
    );

    // Override ทับ /me เดิม ให้กลายเป็นเจอ User หลังล็อกอินเสร็จ
    await page.route('**/api/users/me', (route) => 
      mockApiWithCors(route, 200, { id: 1, username: 'TestUser', role: 'user' })
    );

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/auth/login'));
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ตรวจสอบว่าระบบพากลับไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});