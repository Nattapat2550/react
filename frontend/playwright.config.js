// frontend/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    /* 🌟 1. บังคับ Vite ให้รันที่ 127.0.0.1:5173 เป๊ะๆ และห้ามเปลี่ยนพอร์ตถ้าชน */
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    /* 🌟 2. ดึง Log ของ WebServer ออกมาแสดงใน GitHub Actions */
    stdout: 'pipe',
    stderr: 'pipe',
  },
});