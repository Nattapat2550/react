// backend/utils/pureApiClient.js
// Server-to-server client for calling Pure API (DB-only API layer)

/**
 * Pure API requires `x-api-key` for every /api request.
 * Keep PURE_API_KEY on the backend only (never expose to frontend).
 */

function normalizeBaseUrl(u) {
  return String(u || '').replace(/\/+$/, '');
}

function getConfig() {
  const baseUrl = normalizeBaseUrl(process.env.PURE_API_BASE_URL);
  const apiKey = String(process.env.PURE_API_KEY || '');
  return { baseUrl, apiKey };
}

/**
 * Internal request helper
 * @param {string} path - endpoint path, e.g. "/api/internal/users/profile"
 * @param {object} options - fetch options
 */
async function request(path, options = {}) {
  const { baseUrl, apiKey } = getConfig();

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

  // Use global fetch (Node 18+). If older node, you must polyfill.
  if (typeof fetch !== 'function') {
    const err = new Error(
      'Global fetch() is not available. Please use Node.js 18+ on Render.'
    );
    err.status = 500;
    throw err;
  }

  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = Object.assign(
    {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    options.headers || {}
  );

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body),
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
      const err = new Error(
        (json && (json.message || json.error)) || `Pure API error (${res.status})`
      );
      err.status = res.status;
      err.payload = json || text;
      throw err;
    }

    return json;
  } finally {
    clearTimeout(t);
  }
}

async function post(path, body) {
  return request(path, { method: 'POST', body });
}

async function get(path) {
  return request(path, { method: 'GET' });
}

module.exports = {
  request,
  get,
  post,
};
