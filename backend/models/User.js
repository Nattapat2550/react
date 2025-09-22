const db = require('./db');
const bcrypt = require('bcryptjs');

module.exports = {
  findByEmail: async (email) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  },
  create: async (email, username, password, role = 'user') => {
    const hashedPw = password ? await bcrypt.hash(password, 10) : null;
    const res = await db.query(
      'INSERT INTO users (email, username, password, role, verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [email, username, hashedPw, role]
    );
    return res.rows[0];
  },
  updateProfile: async (id, updates) => {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i+1}`).join(', ');
    const values = Object.values(updates);
    values.unshift(id); // id first
    await db.query(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`, values);
  },
  delete: async (id) => {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  },
  comparePassword: async (password, hashed) => {
    return bcrypt.compare(password, hashed);
  },
  // Admin: Get all users
  getAllUsers: async () => {
    const res = await db.query('SELECT id, email, username, role, profile_pic, theme FROM users');
    return res.rows;
  }
};