// backend/routes/download.js
const express = require('express');
const { proxyFileDownload } = require('../utils/pureApi'); // ฟังก์ชัน proxy ที่สร้างไว้
const router = express.Router();

router.get('/windows', (req, res) => {
  proxyFileDownload(res, '/windows', 'MyAppSetup.exe');
});

router.get('/android', (req, res) => {
  proxyFileDownload(res, '/android', 'app-release.apk');
});

module.exports = router;