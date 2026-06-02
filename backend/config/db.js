const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to Railway MySQL!");
    connection.release();
  }
});

module.exports = pool.promise();

console.log("MYSQLHOST =", process.env.MYSQLHOST);
console.log("MYSQLUSER =", process.env.MYSQLUSER);
console.log("MYSQLDATABASE =", process.env.MYSQLDATABASE);
console.log("MYSQLPORT =", process.env.MYSQLPORT);