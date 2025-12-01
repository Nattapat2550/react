// backend/server.js
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- DB (PostgreSQL) ----
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// ---- Google OAuth2 สำหรับส่งเมลผ่าน Gmail API ----
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

if (process.env.REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
}

async function sendMail(to, subject, text) {
  if (String(process.env.EMAIL_DISABLE).toLowerCase() === 'true') {
    console.log('[MAIL] EMAIL_DISABLE = true, skip sending email to', to);
    return;
  }

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.SENDER_EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken && accessToken.token
      }
    });

    await transporter.sendMail({
      from: `"Support" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      text
    });

    console.log('[MAIL] sent to', to, subject);
  } catch (err) {
    console.error('[MAIL] error', err.message);
  }
}

// ---- Express middlewares ----
app.set('trust proxy', 1); // สำหรับ render ใช้ cookie secure ได้

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ---- Passport Google Login ----
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, username, role, is_email_verified, profile_picture_url
       FROM users WHERE id = $1`,
      [id]
    );
    if (!rows[0]) return done(null, false);
    return done(null, rows[0]);
  } catch (err) {
    return done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) {
          return done(null, false);
        }

        let { rows } = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        let user = rows[0];

        if (!user) {
          const username = profile.displayName || email.split('@')[0];
          const result = await pool.query(
            `INSERT INTO users (email, username, role, is_email_verified, google_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, username, role, is_email_verified, profile_picture_url`,
            [email, username, 'user', true, profile.id]
          );
          user = result.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ---- Helper middlewares ----
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// ---- Multer สำหรับ avatar (เก็บเป็น URL ภายนอกแทน) ----
const upload = multer({ storage: multer.memoryStorage() });

// ---- Routes ----

// Root test
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Auth status
app.get('/api/auth/status', (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false });
  }
  const { id, role, email, username } = req.user;
  res.json({
    authenticated: true,
    id,
    role,
    email,
    username
  });
});

// Register (ส่ง code ยืนยัน email)
app.post('/api/auth/register', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email required' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [cleanEmail]
    );
    if (rows[0]) {
      await pool.query(
        'UPDATE users SET verification_code = $1 WHERE id = $2',
        [code, rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO users (email, role, is_email_verified, verification_code)
         VALUES ($1, $2, $3, $4)`,
        [cleanEmail, 'user', false, code]
      );
    }

    await sendMail(
      cleanEmail,
      'Your verification code',
      `Your verification code is: ${code}`
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify code
app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ error: 'Email and code are required' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, verification_code FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user || user.verification_code !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    await pool.query(
      'UPDATE users SET is_email_verified = $1, verification_code = NULL WHERE id = $2',
      [true, user.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('verify-code error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete profile (ตั้ง username + password)
app.post('/api/auth/complete-profile', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: 'Email, username and password required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `UPDATE users
       SET username = $1, password_hash = $2
       WHERE email = $3 AND is_email_verified = true
       RETURNING id, email, username, role, is_email_verified, profile_picture_url`,
      [username.trim(), passwordHash, email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      return res
        .status(400)
        .json({ error: 'User not found or not verified' });
    }

    req.login(user, (err) => {
      if (err) {
        console.error('login after complete-profile error', err);
        return res.status(500).json({ error: 'Login error' });
      }
      res.json({ ok: true });
    });
  } catch (err) {
    console.error('complete-profile error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, remember } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: 'Email and password are required' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, email, username, password_hash, role, is_email_verified, profile_picture_url
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      return res
        .status(400)
        .json({ error: 'Invalid email or password' });
    }
    if (!user.is_email_verified) {
      return res.status(400).json({ error: 'Email not verified' });
    }

    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) {
      return res
        .status(400)
        .json({ error: 'Invalid email or password' });
    }

    delete user.password_hash;

    // ปรับอายุ cookie ถ้า remember = true
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 วัน
    } else {
      req.session.cookie.expires = false; // session cookie
    }

    req.login(user, (err) => {
      if (err) {
        console.error('login error', err);
        return res.status(500).json({ error: 'Login error' });
      }
      res.json({ ok: true });
    });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.logout(() => {});
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// Forgot password (ส่งลิงก์รีเซ็ตไป email)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email required' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      // ไม่บอกว่าไม่มี user เพื่อความปลอดภัย
      return res.json({ ok: true });
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 ชม.

    await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires_at = $2
       WHERE id = $3`,
      [token, expires, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${token}`;
    await sendMail(
      email.trim().toLowerCase(),
      'Reset your password',
      `Click the link to reset your password: ${resetUrl}`
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('forgot-password error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: 'Token and newPassword required' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, reset_token_expires_at
       FROM users WHERE reset_token = $1`,
      [token]
    );
    const user = rows[0];
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    if (
      !user.reset_token_expires_at ||
      new Date(user.reset_token_expires_at) < new Date()
    ) {
      return res.status(400).json({ error: 'Token expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires_at = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('reset-password error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Google login
app.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: true
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/home`);
  }
);

// ---- User routes ----

// ข้อมูล user ปัจจุบัน
app.get('/api/users/me', requireAuth, async (req, res) => {
  res.json(req.user);
});

// อัปเดต username
app.put('/api/users/me', requireAuth, async (req, res) => {
  const { username } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username required' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET username = $1
       WHERE id = $2
       RETURNING id, email, username, role, is_email_verified, profile_picture_url`,
      [username.trim(), req.user.id]
    );
    const user = rows[0];
    req.login(user, () => {});
    res.json(user);
  } catch (err) {
    console.error('update me error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// อัปโหลด avatar (ตัวอย่าง: ใช้ avatar service ภายนอกแทน ไม่เก็บไฟล์จริง)
app.post(
  '/api/users/avatar',
  requireAuth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      const name = req.user.username || req.user.email || 'U';
      const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=random`;

      const { rows } = await pool.query(
        `UPDATE users
         SET profile_picture_url = $1
         WHERE id = $2
         RETURNING profile_picture_url`,
        [url, req.user.id]
      );

      res.json({ profile_picture_url: rows[0].profile_picture_url });
    } catch (err) {
      console.error('avatar error', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ลบ account ตัวเอง
app.delete('/api/users/me', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    req.logout(() => {});
    req.session.destroy(() => {});
    res.json({ ok: true });
  } catch (err) {
    console.error('delete me error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Admin routes ----
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, username, role, is_email_verified
       FROM users
       ORDER BY id`
    );
    res.json(rows);
  } catch (err) {
    console.error('admin users error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Content / Homepage ----
// React ฝั่งหน้า Home ใช้ /api/homepage
app.get('/api/homepage', async (req, res) => {
  // ตรงนี้เอาแบบ static ง่าย ๆ ถ้าจะใช้ DB จริงค่อยปรับเพิ่ม
  res.json([
    {
      section_name: 'welcome_header',
      content: 'Welcome to your dashboard'
    },
    {
      section_name: 'main_paragraph',
      content: 'This is your main home page content.'
    }
  ]);
});

// ---- Downloads ----
app.get('/api/download', requireAuth, async (req, res) => {
  // ตัวอย่าง static ถ้าจะดึงจาก DB ค่อยเพิ่ม table downloads
  res.json([
    {
      id: 1,
      title: 'User Manual (PDF)',
      file_url:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    }
  ]);
});

// ---- 404 & error handler ----
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});