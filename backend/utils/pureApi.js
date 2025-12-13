// backend/utils/pureApi.js
const PURE_API_URL = process.env.PURE_API_BASE_URL; // เช่น https://pure-api-pry6.onrender.com
const API_KEY = process.env.PURE_API_KEY;

async function callPureApi(endpoint, method = 'POST', body = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    };
    
    // GET request ห้ามมี body
    if (method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${PURE_API_URL}/api/internal${endpoint}`, options);
    
    if (!res.ok) {
      const txt = await res.text();
      console.error(`PureAPI Error [${endpoint}]:`, res.status, txt);
      return null;
    }
    
    const json = await res.json();
    // ถ้า API ตอบกลับมาเป็น { ok: true, data: ... } ให้ดึง data ออกมา
    if (json && json.data !== undefined) {
      return json.data;
    }
    return json;
  } catch (err) {
    console.error(`PureAPI Connection Failed [${endpoint}]:`, err);
    return null;
  }
}

// ฟังก์ชันพิเศษสำหรับ Download File (Proxy)
async function proxyFileDownload(res, endpoint, filename) {
  try {
    const targetUrl = `${PURE_API_URL}/api/download${endpoint}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'x-api-key': API_KEY }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Download failed' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers.get('content-type'));
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'));
    }

    const { Readable } = require('stream');
    // @ts-ignore
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    console.error('Download Error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Internal Error' });
  }
}

module.exports = { callPureApi, proxyFileDownload };