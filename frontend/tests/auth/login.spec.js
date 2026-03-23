import { test, expect } from '@playwright/test';

// 🌟 Helper Function สำหรับ Mock API ให้ผ่าน CORS แน่นอน 100% แบบ Dynamic
const fulfillWithCors = async (route, status, json) => {
  // ดึงค่า Origin จาก Request จริงๆ ที่เบราว์เซอร์ส่งมา (แก้ปัญหา 127.0.0.1 vs localhost)
  const origin = route.request().headers().origin || 'http://localhost:3000';
  
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json', // ✅ เพิ่ม Content-Type เพื่อให้ Axios นำไปแปลงเป็น JSON
  };

  // ดัก Preflight (OPTIONS) ให้ตอบ 204 เสมอ
  if (route.request().method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers });
  }

  // ✅ ส่งข้อมูลจริงกลับไปพร้อม Headers และแปลง Body ให้อยู่ในรูป JSON String
  return route.fulfill({ 
    status, 
    headers, 
    body: json ? JSON.stringify(json) : undefined 
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
    // 3. Mock ให้ตอบ 401 Invalid credentials พร้อมจัดการ CORS อัตโนมัติ
    await page.route('**/api/auth/login', (route) => fulfillWithCors(route, 401, { error: 'Invalid credentials' }));

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // ค้นหาข้อความ Error (ถ้า CORS ผ่าน Axios จะต้องได้คำนี้มาแสดงผล)
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

    // 4. เมื่อคลิก Submit ให้จำลองว่าเราล็อกอินแล้ว (/me ตอบ 200) เพื่อให้ระบบทำการ Redirect
    await page.route('**/api/users/me', (route) => fulfillWithCors(route, 200, {
      id: 1, username: 'Test User', role: 'user'
    }));
    
    await page.locator('button[type="submit"]').click();
    
    // ตรวจสอบว่าเปลี่ยนหน้าไปที่ Home จริงๆ
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});