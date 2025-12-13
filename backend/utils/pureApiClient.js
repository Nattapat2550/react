// backend/utils/pureApiClient.js
// Fetch wrapper to call Pure API (server-to-server) with x-api-key

function normalizeBaseUrl(u) {
  return String(u || '').replace(/\/+$/, '');
}

function getCfg() {
  const baseUrl = normalizeBaseUrl(process.env.PURE_API_BASE_URL);
  const apiKey = String(process.env.PURE_API_KEY || '');
  if (!baseUrl) {
    const err = new Error('PURE_API_BASE_URL is not set');
    err.status = 500;
    throw err;
  }
  if (!apiKey) {
    const err = new Error('PURE_API_KEY is not set');
    err.status = 500;
    throw err;
  }
  if (typeof fetch !== 'function') {
    const err = new Error('Global fetch() is not available. Use Node 18+ on Render.');
    err.status = 500;
    throw err;
  }
  return { baseUrl, apiKey };
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const { baseUrl, apiKey } = getCfg();
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'x-api-key': apiKey,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(headers || {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      // pure-api error format: { ok:false, error:{ code, message, details } }
      const msg =
        json?.error?.message ||
        json?.message ||
        json?.error ||
        `Pure API error (${res.status})`;

      const err = new Error(msg);
      err.status = res.status;
      err.payload = json || text;
      err.code = json?.error?.code; // เผื่ออยากเช็คโค้ด
      throw err;
    }

    return json;
  } finally {
    clearTimeout(t);
  }
}

module.exports = {
  request,
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
};
