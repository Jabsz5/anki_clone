const express = require('express');
const Createmysql = require('mysql2/promise');
const Loginmysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
const { buffer } = require('stream/consumers');
const cors = require('cors');

const app = express();
app.use(express.json()); 
app.use(cors());
app.use(express.static(path.join(__dirname, 'templates')));

const Createpool = Createmysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '14640!Manager', // Replace with your MySQL password
  database: 'userinfo', // Replace with your actual database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//module.exports = pool;

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
    await Createpool.query(sql, [username, hashedPassword]);

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

const Loginpool = Loginmysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '14640!Manager', // Replace with your MySQL password
  database: 'userinfo', // Replace with your actual database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


app.post('/login', express.json(), (req, res) => {
  console.log('Login request received:', req.body);

  const { username, password } = req.body;
  console.log('Received data:', { username, password });
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }


  console.log('Before executing query'); // Check if we get here
  
  const sql = `SELECT password FROM anki_clone_info WHERE username = ?`;
  return Loginpool.query(sql, [username, password], async (err, results) => {
    console.log('Query executed');
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    console.log('Query executed, results:', results);

    if (results.length === 0) {
      return res.status(401).send('Invalid username or password');
    }

    const hashedPassword = results[0].password; //WE WERE NEVER MATCHING THE ENCRYPTIONS!!!!!!

    const match = await bcrypt.compare(password, hashedPassword);

    if (match){
      console.log('Login successful');
      return res.status(200).send('Login successful');
    } else{
      console.log('Invalid username or password');
      return res.status(401).send('Invalid username or password');
    }
  });
});


// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
