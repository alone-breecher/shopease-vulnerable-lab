const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'shopease_user',
  password: process.env.DB_PASS || 'shopease_pass',
  database: process.env.DB_NAME || 'shopease',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
