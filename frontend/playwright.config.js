// frontend/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // 🌟 กลับไปใช้ Port เดียวกับที่รัน Dev โลคอล (3000)
    baseURL: 'http://localhost:3000', 
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // 🌟 รันแบบ dev เหมือนในเครื่องตัวเอง ลดปัญหาหน้าเว็บพังเพราะ Preview/Build
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // เผื่อเวลาให้ Vite Start
  },
});