// react/backend/routes/download.js
const express = require('express');
const router = express.Router();

const PURE_API_URL = process.env.PURE_API_BASE_URL; 
const API_KEY = process.env.PURE_API_KEY;

async function proxyDownload(res, endpoint, filename) {
  try {
    const targetUrl = `${PURE_API_URL}/api/download${endpoint}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (!response.ok) {
      console.error(`Download proxy error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Download failed from upstream' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'));
    }

    const { Readable } = require('stream');
    // @ts-ignore
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);

  } catch (err) {
    console.error('Download proxy exception:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error during download' });
    }
  }
}

router.get('/windows', (req, res) => {
  proxyDownload(res, '/windows', 'MyAppSetup.exe');
});

router.get('/android', (req, res) => {
  proxyDownload(res, '/android', 'app-release.apk');
});

module.exports = router;