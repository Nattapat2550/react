require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const db = require('./models/db');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user (email from profile)
  const user = await db.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
  if (user.rows.length === 0) {
    const newUser  = await db.query(
      'INSERT INTO users (email, username, role, verified) VALUES ($1, $2, $3, true) RETURNING *',
      [profile.emails[0].value, profile.displayName, 'user']
    );
    return done(null, newUser .rows[0]);
  }
  return done(null, user.rows[0]);
}));

passport.serializeUser ((user, done) => done(null, user.id));
passport.deserializeUser (async (id, done) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  done(null, user.rows[0]);
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes); // Protected
app.use('/api/admin', authMiddleware, adminRoutes); // Admin only
app.use('/api/content', contentRoutes);

// Serve static uploads (for profile pics)
app.use('/uploads', express.static('uploads'));

// Init DB tables (run once)
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    profile_pic TEXT DEFAULT 'User .png',
    theme VARCHAR(20) DEFAULT 'light',
    verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS site_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) DEFAULT 'Welcome to Our Site',
    content TEXT DEFAULT 'This is general information on the home page.',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO site_content (id, title, content) SELECT 1, 'Welcome', 'General info' WHERE NOT EXISTS (SELECT 1 FROM site_content);
`).catch(console.error);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));