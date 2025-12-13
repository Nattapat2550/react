// backend/config/db.js
module.exports = {
  query: () => { throw new Error("Legacy DB connection removed. Use pureApi instead."); }
};