require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');


const app = express();

// load route modules
const authRoutes = require('./routes/auth');
const vocabRoutes = require('./routes/vocabulary');
const translateRoutes = require('./routes/translate');

app.use(express.json()); 
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);
app.use('/', vocabRoutes);
app.use('/', translateRoutes);

// Start server
app.listen(3000, () => {
  console.log('Currently running locally... use: 192.168.1.200:3000');
});


