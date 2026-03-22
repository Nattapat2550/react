// frontend/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://127.0.0.1:4173', // 🌟 Preview ของ Vite มักจะรันที่พอร์ต 4173
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // 🌟 1. สั่งให้ Build ก่อน แล้วค่อยรัน Preview (จะเปิดเว็บได้เร็วกว่า dev มาก)
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000, // 🌟 2. ลดเวลารอลงเหลือ 1 นาทีพอ ถ้าไม่ขึ้นแสดงว่ามีปัญหาแล้ว
    stdout: 'pipe',
    stderr: 'pipe',
  },
});