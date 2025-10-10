// backend/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
  process.exit(-1);
});

// ✅ Fail fast: เช็ค connection ตอนสตาร์ท
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connected');
  } catch (e) {
    console.error('[DB] Connection failed. Check DATABASE_URL (host/port/db/creds):', e.message);
    process.exit(1);
  }
})();

module.exports = pool;
