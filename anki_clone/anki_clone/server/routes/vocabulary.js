const express = require('express');
const pool = require('../db/connection');

const router = express.Router();

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
  const { userId, word, language } = req.body;
  if (!userId || !word || !language) return res.status(400).json({ error: 'Missing required fields' });

  try {
    let column;
    if (language === 'Latin') column = 'Spanish';
    else if (language === 'Cyrillic') column = 'Russian';
    else return res.status(400).json({ error: 'Invalid language specified' });

    const query = `DELETE FROM vocabulary_list WHERE user_id = ? AND \`${column}\` = ?`;
    const [result] = await pool.query(query, [userId, word]);

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


module.exports = router;