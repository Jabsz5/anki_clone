const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/connection');

const router = express.Router();


// Serve signup page
router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'CreateAccount.html'));
});

// Signup route
router.post('/signup', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
    
    const vocabQuery = 'SELECT Spanish, Russian FROM vocabulary_list WHERE user_id = ?';
    const [vocabResults] = await pool.query(vocabQuery, [user.id]);

    // Separate Spanish and Russian words
    const spanishWords = vocabResults
        .filter(entry => entry.Spanish)
        .map(entry => entry.Spanish);

    const russianWords = vocabResults
        .filter(entry => entry.Russian)
        .map(entry => entry.Russian);

    console.log("user ID: " + user.id);


    res.status(200).json({
      username: user.username,
      userId: user.id,
      vocabulary: {
        spanish: spanishWords,
        russian: russianWords,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;