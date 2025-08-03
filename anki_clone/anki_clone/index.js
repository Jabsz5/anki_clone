require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const translate = require('@vitalets/google-translate-api');

const app = express();

app.use(express.json()); 
app.use(cors());
app.use(express.static(path.join(__dirname, 'templates')));


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Serve signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'CreateAccount.html'));
});

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO anki_clone_user_info (username, password) VALUES (?, ?)`;

    await pool.query(sql, [username, hashedPassword]);

    res.status(201).send('Account created successfully');
  } catch (err) {
    console.error('Error in /signup:', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).send('Username already exists');
    res.status(500).send('Internal server error');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Username and password are required.');

  try {
    const sql = `SELECT * FROM anki_clone_user_info WHERE username = ?`;
    const [results] = await pool.query(sql, [username]);

    if (results.length === 0) return res.status(401).send('Invalid username or password');

    const user = results[0];
    const userId = user.id;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send('Invalid username or password');

    // if we get to this part, then username and password has been validated
    
    const vocabQuery = 'SELECT Spanish, Russian FROM vocabulary_list WHERE id = ?';
    const [vocabResults] = await pool.query(vocabQuery, [user.id]);

    console.log("user ID: " + user.id);
    res.status(200).json({
      username: user.username,
      vocabulary: vocabResults,
      userId: user.id,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Get vocabulary
app.get('/get-vocabulary', async (req, res) => {
  const userId = req.query.userId;
  console.log('GET /get-vocabulary hit with userId: ', userId);

  try {
    const [results] = await pool.query('SELECT Spanish, Russian FROM vocabulary_list WHERE user_id = ?', [userId]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching vocabulary:', err);
    res.status(500).send('Server error');
  }
});

// Store word
app.post('/store-word', async (req, res) => {
  const { userId, word, language } = req.body;

  console.log("adding word: ", {userId, word, language});

  if (!userId || !word || !language) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const column = language === 'Latin' ? 'Spanish' : 'Russian';
    const query = `INSERT INTO vocabulary_list (user_id, ${column}) VALUES (?, ?)`;
    await pool.query(query, [userId, word]);
    res.status(200).json({ message: 'Word added successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to add word to the database' });
  }
});

// Remove word
app.post('/remove-word', async (req, res) => {
  const { id, word, language } = req.body;
  if (!id || !word || !language) return res.status(400).json({ error: 'Missing required fields' });

  try {
    let column;
    if (language === 'Latin') column = 'Spanish';
    else if (language === 'Cyrillic') column = 'Russian';
    else return res.status(400).json({ error: 'Invalid language specified' });

    const query = `DELETE FROM vocabulary_list WHERE id = ? AND \`${column}\` = ?`;
    const [result] = await pool.query(query, [id, word]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Word removed successfully' });
    } else {
      res.status(404).json({ error: 'Word not found in the database' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to remove word from the database' });
  }
});

// Language detection
app.post("/translate", async (req, res) => {
  const data = req.body;
  if (!data || !data.text) return res.status(400).json({ error: "Missing 'text' field in JSON" });

  try {
    const result = await translate(data.text, { to: "en" });
    res.json({ detected_language: result.from.language.iso });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Failed to detect language" });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
