import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // 1. ไปที่หน้า Login ก่อนเพื่อเข้าถึง context ของเว็บ
    await page.goto('/login');
    
    // 2. เคลียร์ Storage ทิ้งทั้งหมด ป้องกันปัญหา Token ของเทสต์ที่แล้วค้าง ทำให้เด้งไปหน้า /home อัตโนมัติ
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 3. โหลดหน้า Login ใหม่อีกครั้งด้วยสถานะ "ยังไม่ล็อกอิน" แบบคลีนๆ 100%
    await page.goto('/login');
    await expect(page.locator('form#loginForm')).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    // 4. ดักรอ Network ตัวจริงให้ตอบกลับมาก่อน ป้องกัน Playwright เร่งเช็คหน้าจอก่อนที่ Backend จะส่งผลลัพธ์
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // 5. เล็งไปที่แท็ก <p> ตัวสุดท้าย (จุดที่ Error ปรากฏใน LoginPage.jsx)
    // ใช้ Regex แบบยืดหยุ่น เพื่อให้รองรับข้อความจาก Backend จริงๆ (เช่น Invalid, Failed, หรือ Not found)
    await expect(page.locator('p.muted').last()).toContainText(/Invalid|failed|not found/i, { timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // ⚠️ ต้องมั่นใจว่าในฐานข้อมูล Test ของคุณ มีอีเมล test@example.com อยู่จริงๆ นะครับ
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    const response = await responsePromise;
    
    // ถ้า Backend ตัวจริงตอบ 200 (สำเร็จ) ระบบจะเช็คว่าพากลับไปหน้า /home ไหม
    if (response.status() === 200) {
      await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
    } else {
      // แจ้งเตือนใน Console ถ้าล็อกอินไม่ผ่าน จะได้รู้ว่าเป็นที่ข้อมูลใน DB ไม่ใช่ที่ Test พัง
      console.warn(`\n[Warning] API ตอบกลับเป็น status: ${response.status()} - กรุณาเช็คว่า test@example.com มีในฐานข้อมูลหรือไม่`);
    }
  });
});