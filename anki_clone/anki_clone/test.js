const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '???', // Replace with your actual password
  database: 'userinfo', // Replace with your actual database name
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database!');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to the database:', err);
  }
}

testConnection();
