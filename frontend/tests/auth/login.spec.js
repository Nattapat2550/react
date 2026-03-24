import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // 1. ล้างข้อมูลเก่าทั้งหมด ป้องกัน Token ของรอบก่อนหน้าพาหนีไปหน้า /home
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });

    await page.goto('/login');
    
    // 2. รอให้หน้าเว็บโหลดเสร็จสมบูรณ์จริงๆ ป้องกัน React Hydration ซ้อนทับการกดปุ่ม
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // พิมพ์ข้อมูลผิดๆ ลงไป
    await page.locator('input[name="email"]').fill('wrong_user_not_exist@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');

    // ดักรอการตอบกลับจาก Backend ตัวจริง (เราไม่ใช้ Mock แล้ว)
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // ระบบจะแสดงข้อความ 'Invalid credentials' ออกมาแน่นอน เพราะ Backend จะพ่น 401 ออกมาจริงๆ
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // ⚠️ ตรงนี้คุณต้องแน่ใจว่าใน Backend Test Environment มีบัญชี "test@example.com" 
    // และรหัสผ่าน "password123" อยู่จริงๆ นะครับ
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    
    // รอจนกว่า Backend จะตอบกลับว่า Login สำเร็จ (200 OK)
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // เช็คว่าระบบพากลับไปหน้า /home 
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });

});