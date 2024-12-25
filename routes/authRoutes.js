const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const path = require('path');
const router = express.Router();

// Serve Sign-Up Page
router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/signup.html'));
});

// Serve Login Page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Sign-Up Handler
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword],
    (err) => {
      if (err) return res.status(500).send('Error signing up');
      res.send('User registered successfully');
    }
  );
});

// Login Handler
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).send('Invalid credentials');

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      req.session.userId = user.id;
      res.send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});

module.exports = router;
