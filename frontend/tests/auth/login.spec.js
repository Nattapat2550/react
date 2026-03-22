import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {
  test.beforeEach(async ({ page }) => {
    // ไปที่หน้า Login ก่อนเริ่มทุกเทสต์
    await page.goto('/login');
  });

  test('should display required validation errors on empty submission', async ({ page }) => {
    // พยายามกดปุ่ม Login โดยไม่กรอกข้อมูล
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();
    
    // ตรวจสอบว่ามีข้อความแจ้งเตือนให้กรอกข้อมูล
    await expect(page.getByText('Please enter your email')).toBeVisible();
    await expect(page.getByText('Please enter your password')).toBeValidationMessage();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // Mock API Response ให้ตอบกลับเป็น 401 Unauthorized
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid credentials' })
      });
    });

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

    // ตรวจสอบ Toast หรือ Error Message บนหน้าจอ
    await expect(page.locator('.toast-error')).toContainText('Invalid credentials');
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock API Response ให้ตอบกลับสำเร็จ
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, token: 'fake-jwt-token' })
      });
    });

    // Mock API สำหรับดึงข้อมูล User หลัง Login
    await page.route('**/api/v1/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { name: 'Test User', role: 'user' } })
      });
    });

    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

    // ตรวจสอบการ Redirect ไปหน้า Home
    await expect(page).toHaveURL('/');
    
    // ตรวจสอบว่า Navbar เปลี่ยนไปแสดงชื่อผู้ใช้และปุ่ม Logout
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByRole('button', { name: /ออกจากระบบ/i })).toBeVisible();

    // ตรวจสอบ Local Storage ว่ามี Token ถูกเก็บไว้จริง
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('fake-jwt-token');
  });
});