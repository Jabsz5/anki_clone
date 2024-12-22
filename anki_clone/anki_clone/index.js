const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(express.json()); 


app.use(express.static(path.join(__dirname, 'templates')));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '14640!Manager', // Replace with your MySQL password
  database: 'userinfo', // Replace with your actual database name
});

// Route to serve the CreateAccount.html
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'CreateAccount.html'));
});

// POST route for user signup
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into the database
    const sql = `
      INSERT INTO anki_clone_info (username, password)
      VALUES (?, ?)
    `;
    await pool.query(sql, [username, hashedPassword]);

    res.status(201).send('Account created successfully');
  } catch (err) {
    console.error('Error in /signup:', err);

    // Handle duplicate username errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).send('Username already exists');
    }

    res.status(500).send('Internal server error');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    // Insert user into the database
    // So now instead of inserting, I want to retrieve information from the database
    const sql = `SELECT * FROM anki_clone_info`;
    const [rows] = await pool.execute(sql);
    console.log("Query results: ", rows);
    res.status(201).send('Account login successful');
  } catch (err) {
    console.error('Error in /login:', err);

    // Handle duplicate username errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).send('Username does not exists');
    }

    res.status(500).send('Internal server error');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
