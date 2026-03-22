// frontend/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    /* 🌟 แก้ไข: เปลี่ยนจาก localhost เป็น 127.0.0.1 */
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
    command: 'npm run dev',
    /* 🌟 แก้ไข: เปลี่ยนจาก localhost เป็น 127.0.0.1 ตรงนี้ด้วย! */
    url: 'http://127.0.0.1:5173', 
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});