// frontend/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* รันเทสต์แบบขนานเพื่อความรวดเร็ว */
  fullyParallel: true,
  /* ตั้งค่าการ Retry กรณีเทสต์พังบน CI */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    /* 🌟 จุดสำคัญที่ 1: ตั้งค่า Base URL ตรงนี้ */
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // สามารถเพิ่ม Firefox, WebKit ได้ถ้าต้องการ
  ],

  /* 🌟 จุดสำคัญที่ 2: สั่งให้ Playwright เปิดเซิร์ฟเวอร์ React อัตโนมัติก่อนเทสต์ */
  webServer: {
    command: 'npm run dev', // คำสั่งที่ใช้ start React (Vite)
    url: 'http://localhost:5173', // URL ที่ต้องรอให้โหลดเสร็จก่อนเริ่มเทสต์
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});