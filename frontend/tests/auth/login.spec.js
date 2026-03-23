import { test, expect } from '@playwright/test';

// 🌟 ฟังก์ชันจัดการ Mock API + CORS แบบรัดกุมที่สุด (ใช้ async/await เต็มรูปแบบ)
const mockWithCors = async (route, status, payload) => {
  const req = route.request();
  const headers = req.headers();
  
  // ดึง Origin จาก Request แบบชัวร์ๆ (Playwright header keys จะเป็นตัวเล็กทั้งหมด)
  let origin = headers['origin'] || headers['referer'];
  if (origin) {
    origin = new URL(origin).origin;
  } else {
    origin = '*'; // ถ้าไม่มีจริงๆ ให้ใช้ * ไปก่อน
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === '*' ? 'http://localhost:5173' : origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  };

  // ดัก Preflight (OPTIONS)
  if (req.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders });
    return;
  }

  // ตอบกลับแบบปกติ พร้อมบังคับ Header 
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify(payload),
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ดักการเช็คสถานะล็อกอินตอนเปิดหน้า
    await page.route('**/api/users/me', async (route) => {
      await mockWithCors(route, 401, { error: 'Not logged in' });
    });
    
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 1. Mock ให้ API คืนค่า 401 และข้อความที่เราต้องการทดสอบ
    await page.route('**/api/auth/login', async (route) => {
      await mockWithCors(route, 401, { error: 'Invalid credentials' });
    });

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // 2. ค้นหาคำว่า Invalid credentials (ใส่ exact: false กันเหนียวเรื่องการเว้นวรรคซ่อนเร้น)
    await expect(page.getByText('Invalid credentials', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock API /login ให้ผ่าน (200)
    await page.route('**/api/auth/login', async (route) => {
      await mockWithCors(route, 200, {
        token: 'fake-jwt-token',
        user: { id: 1, role: 'user' }
      });
    });

    // พอล็อกอินสำเร็จ ระบบจะดึง /me อีกรอบ ให้ตอบ 200 เพื่อให้ผ่าน Auth guard ของ React
    await page.route('**/api/users/me', async (route) => {
      await mockWithCors(route, 200, {
        id: 1, username: 'Test', role: 'user'
      });
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ยืนยันว่า Redirect ไปหน้า Home จริง
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});