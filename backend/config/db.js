// backend/config/db.js
module.exports = {
  query: () => { 
    throw new Error("Local DB connection is disabled. Please use 'pureApi' instead."); 
  }
};