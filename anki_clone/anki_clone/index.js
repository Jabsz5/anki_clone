require('dotenv').config();

const express = require('express');
const Createmysql = require('mysql2/promise');
const Loginmysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
const { buffer } = require('stream/consumers');
const cors = require('cors');
const translate = require('@vitalets/google-translate-api');

const app = express();

app.use(express.json()); 
app.use(cors());
app.use(express.static(path.join(__dirname, 'templates')));

const pool = Createmysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const Createpool = Createmysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


app.post('/login', express.json(), (req, res) => {
  console.log('Login request received:', req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  const sql = `SELECT password FROM anki_clone_info WHERE username = ?`;
  return Loginpool.query(sql, [username, password], async (err, results) => {
  
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 0) {
      return res.status(401).send('Invalid username or password');
    }

    const hashedPassword = results[0].password; // WE WERE NEVER MATCHING THE ENCRYPTIONS!!!!!!
    const match = await bcrypt.compare(password, hashedPassword, (err, isMatch) => {
      if (err) return res.status(500).send('Server error');
      if (!isMatch) return res.status(401).send('Invalid username or password');

      const vocabQuery = 'SELECT Spanish, Russian FROM vocabulary_list WHERE UserID = ?';
      Loginpool.query(vocabQuery, [username.ID], (err, vocabResults) => {
        if (err) return res.status(500).send('Server error');

        res.status(200).json({
          username: username.username,
          vocabulary: vocabResults,
        });
      });
    });
  });
});

app.get('/get-vocabulary', (req, res) => {
  const userId = req.query.userId; // Assume user ID is passed as a query parameter

  const query = 'SELECT Spanish, Russian FROM vocabulary_list WHERE UserID = ?';
  Loginpool.query(query, [userId], (err, results) => {
      if (err) {
          console.error('Error fetching vocabulary:', err);
          return res.status(500).send('Server error');
      }
      res.status(200).json(results);
  });
});

app.post('/store-word', async (req, res) => {
  const { userId, word, language } = req.body;

  if (!userId || !word || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {

    let column;

    if (language === 'Latin'){
      column = 'Spanish';
    }
    else{
      column = 'Russian';
    }

    const connection = await Loginpool.promise();
      // Insert the word into the database
      const query = `
          INSERT INTO vocabulary_list (UserID, ${column}) 
          VALUES (?, ?)
      `;
      await connection.query(query, [userId, word])

      res.status(200).json({ message: 'Word added successfully' });
  } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to add word to the database' });
  }
});

app.post("/remove-word", async (req, res) => {

  const {userId, word, language} = req.body;

  console.log("Received delete request:", req.body); //DEBUGGING

  if (!userId || !word || !language){
    return res.status(400).json({ error: 'Missing required fields...'});
  }

  try {
    let column;

    if (language === 'Latin') {
      column = 'Spanish';
    } else if (language === 'Cyrillic') {
      column = 'Russian';
    } else {
      return res.status(400).json({ error: 'Invalid language specified' });
    }

    const connection = await Loginpool.promise();

    const query = `DELETE FROM vocabulary_list WHERE UserID = ? AND \`${column}\` = ?`;
    console.log("Executing query:", query, [userId, word]); // DEBUG 2

    const [result] = await connection.query(query, [userId, word]);

    console.log("Query result:", result); // DEBUG 3

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

app.post("/translate", async (req, res) => {
  const data = req.body;
  
  if (!data || data.text){
    return res.status(400).json({ error: "Missing 'text' field in JSON"});
  }

  const videoTitle = data.text;

  try {
    // deep-translator for lang-detection
    const result = await translate(videoTitle, {to: "en"});
    res.json({ detected_language: result.from.language.iso});
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({error: "Failed to detect language" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
