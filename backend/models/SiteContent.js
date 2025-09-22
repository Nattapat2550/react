const db = require('./db');

module.exports = {
  get: async () => {
    const res = await db.query('SELECT * FROM site_content LIMIT 1');
    return res.rows[0];
  },
  update: async (title, content) => {
    await db.query(
      'UPDATE site_content SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
      [title, content]
    );
  }
};