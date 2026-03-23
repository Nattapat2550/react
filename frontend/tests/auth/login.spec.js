import { test, expect } from '@playwright/test';

// 🌟 สร้างฟังก์ชัน Helper เล็กๆ สำหรับใช้ซ้ำ เพื่อให้โค้ดดูสะอาดตา
const mockApiWithCors = async (route, status, bodyData) => {
  const headers = {
    'Access-Control-Allow-Origin': route.request().headers().origin || '*',
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
    // ⭐️ เพิ่ม Mock ให้เทสต์แรก (รอบที่แล้วผมลืมใส่ตรงนี้ มันเลย Timeout ครับ)
    await page.route('**/api/auth/login', (route) => 
      mockApiWithCors(route, 401, { error: 'Invalid credentials' })
    );

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    // ตอนนี้มันจะได้รับข้อความ Invalid credentials กลับมาทันที
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินสำเร็จ (ท่าเดียวกับเทสต์ที่แล้วที่ผ่าน)
    await page.route('**/api/auth/login', (route) => 
      mockApiWithCors(route, 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } })
    );

    // Override ทับ /me เดิม ให้กลายเป็นเจอ User หลังล็อกอินเสร็จ
    await page.route('**/api/users/me', (route) => 
      mockApiWithCors(route, 200, { id: 1, username: 'TestUser', role: 'user' })
    );

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ตรวจสอบว่าระบบพากลับไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});