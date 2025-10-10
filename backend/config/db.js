// backend/config/db.js
const { Pool } = require('pg');
const { URL } = require('url');

const RAW_URL = process.env.DATABASE_URL;

// ลิสต์โดเมน Render/Postgres ที่พบบ่อย (จะลองตามลำดับ)
// **ไม่เปลี่ยนค่า env** แค่ "เดาช่วย" ตอนสร้าง connection
const DOMAIN_TRIES = [
  '', // ใช้ค่าเดิมก่อน
  '.singapore-postgres.render.com',
  '.oregon-postgres.render.com',
  '.frankfurt-postgres.render.com',
  '.washington-postgres.render.com',
];

function buildUrlWithHostSuffix(raw, suffix) {
  try {
    const u = new URL(raw);
    // ถ้า host เดิมมีจุดอยู่แล้ว (เช่น มีโดเมนครบ) ก็คืนเดิมเลย
    if (u.hostname.includes('.')) return u.toString();

    // ถ้าไม่มีจุด (เช่น dpg-xxxxxx-a) และ suffix ว่าง ให้คืนเดิมเพื่อ "ลองก่อน"
    if (!suffix) return u.toString();

    // เติมโดเมนและพอร์ต 5432 ถ้ายังไม่ระบุ
    const host = u.hostname + suffix;
    const port = u.port && u.port !== '' ? u.port : '5432';
    u.hostname = host;
    u.host = `${host}:${port}`;
    u.port = port;

    // บาง provider ต้องการ sslmode=require; โค้ดเราก็เปิด ssl อยู่แล้ว
    // จะไม่ยุ่ง query string เดิม
    return u.toString();
  } catch {
    return raw; // ถ้า parse ไม่ได้ ให้คืนค่าดิบ
  }
}

async function pickWorkingConnectionString() {
  for (const suffix of DOMAIN_TRIES) {
    const candidate = buildUrlWithHostSuffix(RAW_URL, suffix);
    const testPool = new Pool({
      connectionString: candidate,
      ssl: { rejectUnauthorized: false },
      // ทำให้ fail เร็วขึ้นหน่อย ถ้าต่อไม่ได้
      idleTimeoutMillis: 2000,
      connectionTimeoutMillis: 3000,
    });
    try {
      await testPool.query('SELECT 1');
      await testPool.end();
      if (suffix) {
        console.log(`[DB] Using fallback host suffix "${suffix}" -> OK`);
      } else {
        console.log('[DB] Using DATABASE_URL as-is -> OK');
      }
      return candidate;
    } catch (e) {
      await testPool.end().catch(()=>{});
      // ถ้า DNS หาไม่เจอ / ต่อไม่ได้ ให้ลองอันถัดไป
      console.warn(`[DB] Candidate failed (${suffix || 'raw'}): ${e.code || e.message}`);
    }
  }
  throw new Error('No working Postgres host variant found. Please verify DATABASE_URL host/domain.');
}

let pool;
let initPromise;

function getPool() {
  // lazy init: สร้าง pool แค่รอบเดียว
  if (pool) return pool;
  if (!initPromise) {
    initPromise = (async () => {
      const cs = await pickWorkingConnectionString();
      pool = new Pool({
        connectionString: cs,
        ssl: { rejectUnauthorized: false },
      });

      // ใส่ตัวดัก error
      pool.on('error', (err) => {
        console.error('Unexpected PG error', err);
        // ถ้าอยากให้ล้มทันที: process.exit(-1);
      });

      // sanity check ครั้งสุดท้าย
      await pool.query('SELECT 1');
      return pool;
    })();
  }
  throw new Error('DB pool not ready yet. Ensure you import and use pool after initialization.');
}

// export เป็น proxy ที่รอ init อัตโนมัติ
// วิธีใช้เดิมในโค้ดคุณ: const pool = require('../config/db'); pool.query(...)
// เราจะคืน object ที่มี .query ให้เรียกได้ทันที (จะ await init ภายใน)
module.exports = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === 'then') return undefined; // ให้ require(...) ไม่ถูกมองเป็น thenable
      return async (...args) => {
        const p = pool || (await initPromise?.catch(()=>null)) || (await (async () => {
          // ถ้ายังไม่ init ให้ init ตอนเรียกครั้งแรก
          const cs = await pickWorkingConnectionString();
          pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false }});
          pool.on('error', (err) => console.error('Unexpected PG error', err));
          return pool;
        })());
        if (typeof p[prop] !== 'function') {
          throw new Error(`pool.${String(prop)} is not a function`);
        }
        return p[prop](...args);
      };
    }
  }
);
