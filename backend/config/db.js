const { Pool } = require('pg');
const { URL } = require('url');

const RAW_URL = process.env.DATABASE_URL;
const DOMAIN_TRIES = [
  '',
  '.singapore-postgres.render.com',
  '.oregon-postgres.render.com',
  '.frankfurt-postgres.render.com',
  '.washington-postgres.render.com',
];

function buildUrlWithHostSuffix(raw, suffix) {
  try {
    const u = new URL(raw);
    if (u.hostname.includes('.')) return u.toString();
    if (!suffix) return u.toString();
    const host = u.hostname + suffix;
    const port = u.port && u.port !== '' ? u.port : '5432';
    u.hostname = host;
    u.host = `${host}:${port}`;
    u.port = port;
    return u.toString();
  } catch { return raw; }
}

async function pickWorkingConnectionString() {
  for (const suffix of DOMAIN_TRIES) {
    const candidate = buildUrlWithHostSuffix(RAW_URL, suffix);
    const testPool = new Pool({
      connectionString: candidate,
      ssl: { rejectUnauthorized: false },
      idleTimeoutMillis: 2000,
      connectionTimeoutMillis: 3000,
    });
    try {
      await testPool.query('SELECT 1');
      await testPool.end();
      if (suffix) console.log(`[DB] Using fallback host suffix "${suffix}" -> OK`);
      else console.log('[DB] Using DATABASE_URL as-is -> OK');
      return candidate;
    } catch (e) {
      await testPool.end().catch(()=>{});
      console.warn(`[DB] Candidate failed (${suffix || 'raw'}): ${e.code || e.message}`);
    }
  }
  throw new Error('No working Postgres host variant found.');
}

let pool;
let initPromise;

module.exports = new Proxy({}, {
  get(_t, prop) {
    if (prop === 'then') return undefined;
    return async (...args) => {
      const p = pool || (await (initPromise ||= (async () => {
        const cs = await pickWorkingConnectionString();
        pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });
        pool.on('error', (err) => console.error('Unexpected PG error', err));
        await pool.query('SELECT 1');
        return pool;
      })()));
      if (typeof p[prop] !== 'function') throw new Error(`pool.${String(prop)} is not a function`);
      return p[prop](...args);
    };
  }
});
