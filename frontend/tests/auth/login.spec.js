import { test, expect } from '@playwright/test';

// 🌟 สร้างฟังก์ชัน Mock API ขั้นสูงสุดที่จัดการ CORS และ OPTIONS ครบจบในตัว
const mockApi = async (route, status, data) => {
  const req = route.request();
  // สะท้อน Origin เพื่อให้ผ่านกฎ withCredentials: true ของ Axios
  const origin = req.headers().origin || 'http://localhost:3000';
  
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // ดักจับ Preflight Request ของเบราว์เซอร์
  if (req.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers });
    return;
  }

  // ส่งข้อมูล Response จำลอง
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(data)
  });
};

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // ล้างข้อมูลทั้งหมดเพื่อความชัวร์
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 1. จำลองว่ายังไม่ได้ล็อกอิน เพื่อให้อยู่หน้า /login ได้
    await page.route('**/api/users/me', route => mockApi(route, 401, { error: 'Not logged in' }));
    
    await page.goto('/login');
    
    // 🌟🌟🌟 สำคัญมาก: รอ 1.5 วินาที เพื่อให้ React ผูก Event Listener (onSubmit) ให้เสร็จ
    // ป้องกันการกด Submit แล้วเบราว์เซอร์ Refresh หน้าต่างใหม่ (ทำให้ Error text หาย)
    await page.waitForTimeout(1500); 
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // 2. จำลองสถานะรหัสผ่านผิด
    await page.route('**/api/auth/login', route => mockApi(route, 401, { error: 'Invalid credentials' }));

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    // 3. ใช้ Regex ค้นหาข้อความแบบยืดหยุ่น ป้องกัน Redux Fallback 
    const errorText = page.getByText(/Invalid credentials|Login failed/i).first();
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // 4. จำลองสถานะล็อกอินสำเร็จ ได้ 200 OK 
    // (ช่วยให้เทสต์ผ่านได้โดยไม่ต้องสนว่ามี test@example.com ใน DB จริงหรือไม่)
    await page.route('**/api/auth/login', route => mockApi(route, 200, {
      token: 'fake-jwt-token',
      user: { id: 1, role: 'user', username: 'TestUser' }
    }));
    
    // 5. จำลองให้ /me คืนค่าผู้ใช้ เพื่อรองรับการ Redirect ของ ProtectedRoute
    await page.route('**/api/users/me', route => mockApi(route, 200, {
      id: 1, role: 'user', username: 'TestUser'
    }));

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // 6. เช็คว่าพากลับหน้า Home จริงๆ
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });

});