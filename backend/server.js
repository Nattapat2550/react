// backend/server.js
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// ✅ loader กัน ESM/CJS export mismatch (แก้ error handler must be a function)
function loadRouter(relPath) {
  const mod = require(relPath);

  // case1: module.exports = router (router เป็น function)
  if (typeof mod === 'function') return mod;

  // case2: export default router (require จะได้ { default: fn })
  if (mod && typeof mod.default === 'function') return mod.default;

  // case3: exports.router = router (require จะได้ { router: fn })
  if (mod && typeof mod.router === 'function') return mod.router;

  // case4: exports = { ... } แต่มี member เป็น function router
  if (mod && typeof mod === 'object') {
    for (const k of Object.keys(mod)) {
      if (typeof mod[k] === 'function') return mod[k];
    }
  }

  // ถ้าถึงตรงนี้ แปลว่า export ผิดจริง
  const keys = mod && typeof mod === 'object' ? Object.keys(mod) : [];
  throw new Error(
    `Route module "${relPath}" does not export an Express router function. ` +
      `Got type="${typeof mod}" keys=[${keys.join(', ')}]`
  );
}

const authRoutes = loadRouter('./routes/auth');
const userRoutes = loadRouter('./routes/users');
const adminRoutes = loadRouter('./routes/admin');
const homepageRoutes = loadRouter('./routes/homepage');
const carouselRoutes = loadRouter('./routes/carousel');
const downloadRoutes = loadRouter('./routes/download');

const app = express();
app.set('trust proxy', 1);

// 1) Security Headers
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'self'; base-uri 'self';"
  );
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2) Compression & Parsing
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(cookieParser());

// 3) CORS
const normalizeOrigin = (s) => (s ? s.trim().replace(/\/+$/, '') : '');
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);

      const o = normalizeOrigin(origin);
      if (allowedOrigins.includes(o)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);

// 4) Rate Limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// 5) API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/download', downloadRoutes);

// 6) Root Route
app.get('/', (_req, res) => {
  if (process.env.FRONTEND_URL) {
    return res.redirect(process.env.FRONTEND_URL);
  }
  return res.status(200).send('Backend API is running');
});

// 7) Favicon Handler
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// 8) Health Check
app.get('/health', (_req, res) => res.json({ ok: true }));

// 9) 404 Not Found
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 10) Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});