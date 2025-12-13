const express = require('express');
const api = require('../config/api'); // เรียกใช้ axios instance ที่เราสร้างไว้ (ที่มี x-api-key)
const router = express.Router();

router.get('/', (_req, res) => {
  // ส่งรายการไฟล์กลับไปให้ Frontend (URL ยังคงชี้มาที่ backend ของ react เหมือนเดิม)
  const items = [
    {
      id: 1,
      title: 'Windows Installer',
      file_url: '/api/download/windows'
    },
    {
      id: 2,
      title: 'Android APK',
      file_url: '/api/download/android'
    }
  ];
  res.json(items);
});

// ฟังก์ชันสำหรับ Proxy การดาวน์โหลด
async function proxyDownload(res, apiPath, fallbackFilename) {
  try {
    // เรียกไปที่ Pure API โดยระบุ responseType เป็น 'stream'
    const response = await api.get(apiPath, { responseType: 'stream' });

    // ตั้งค่า Header ตามที่ได้กลับมา เพื่อให้ Browser รู้ว่าเป็นไฟล์ดาวน์โหลด
    res.setHeader('Content-Type', response.headers['content-type']);
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      res.setHeader('Content-Disposition', disposition);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${fallbackFilename}"`);
    }

    // ส่งข้อมูล (Pipe) จาก Pure API ไปหาผู้ใช้ทันที
    response.data.pipe(res);
  } catch (e) {
    console.error(`Download proxy error (${apiPath}):`, e.message);
    if (e.response && e.response.status === 404) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    res.status(500).json({ error: 'Failed to download file' });
  }
}

// GET /api/download/windows
router.get('/windows', (req, res) => {
  proxyDownload(res, '/api/download/windows', 'MyAppSetup.exe');
});

// GET /api/download/android
router.get('/android', (req, res) => {
  proxyDownload(res, '/api/download/android', 'app-release.apk');
});

module.exports = router;