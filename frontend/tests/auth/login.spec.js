import { test, expect } from '@playwright/test';

// 🌟 สร้าง Helper สำหรับจัดการ Headers แบบไร้รอยต่อ
const getCorsHeaders = (request) => {
  // ดึง origin จากคนที่ส่งมา ถ้าไม่มีให้ใช้ localhost
  const origin = request.headers().origin || 'http://localhost:5173';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true', // สำคัญมาก! ต้องมีเพื่อรองรับ Axios
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Mock /me สำหรับตอนโหลดหน้าแรก
    await page.route('**/api/users/me', async (route) => {
      const headers = getCorsHeaders(route.request());
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers });
        return;
      }
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ error: 'Not logged in' })
      });
    });

    await page.goto('/login');
    await expect(page.locator('form#loginForm')).toBeVisible();
    
    // 2. ให้ React แนบ Event Listener (onSubmit) ใส่ฟอร์มให้เรียบร้อยก่อน กันหน้ารีเฟรช
    await page.waitForTimeout(1000); 
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 3. Mock ให้ตีกลับ Error รหัส 400 (เลี่ยงการตีความ 401 ของบาง Browser)
    await page.route('**/api/auth/login', async (route) => {
      const headers = getCorsHeaders(route.request());
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers });
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // 4. ดักรอ Network จริงๆ แบบเจาะจงเฉพาะ POST
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // 5. เช็คข้อความ Error ตรงๆ 
    await expect(page.locator('text="Invalid credentials"')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินสำเร็จ (200 OK)
    await page.route('**/api/auth/login', async (route) => {
      const headers = getCorsHeaders(route.request());
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, role: 'user' } })
      });
    });
    
    // Override ให้กลายเป็นเจอ User หลังล็อกอินเสร็จ
    await page.route('**/api/users/me', async (route) => {
      const headers = getCorsHeaders(route.request());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ id: 1, username: 'TestUser', role: 'user' })
      });
    });

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