const express = require('express');
const path = require('path');
const db = require('../models/db');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Serve the user dashboard
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/user_dashboard.html'));
  });

// Fetch information for Organik waste
router.get('/api/organik', (req, res) => {
  res.json({
    title: 'Sampah Organik',
    description: 'Sampah organik adalah sampah yang berasal dari sisa makhluk hidup, seperti daun, sisa makanan, dan sebagainya. ',
    trivia: 'Sampah organik bisa diolah menjadi kompos yang bermanfaat untuk menyuburkan tanah.',
  });
});

// Fetch information for Anorganik waste
router.get('/api/anorganik', (req, res) => {
  res.json({
    title: 'Sampah Anorganik',
    description: 'Sampah anorganik adalah sampah yang tidak mudah terurai, seperti plastik, kaleng, dan kaca.',
    trivia: 'Sampah anorganik dapat didaur ulang menjadi berbagai produk baru.',
  });
});

// Search Trash Data
router.get('/search', (req, res) => {
    const query = req.query.query;
    const sql = `
      SELECT trash.*, classifications.name AS classification_name
      FROM trash
      JOIN classifications ON trash.classification_id = classifications.id
      WHERE trash.name LIKE ? OR trash.description LIKE ?
    `;
    const searchTerm = `%${query}%`;
  
    db.query(sql, [searchTerm, searchTerm], (err, results) => {
      if (err) {
        console.error('Error searching trash:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });
  
  
// Route to handle AI classification using Gemini
router.post('/classify-ai', async (req, res) => {
    const { query } = req.body;
  
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
      // Improved prompt with explicit examples
      const prompt = `
        Classify the following item: "${query}" as either 'Organik' (organic) or 'Anorganik' (inorganic).
        - 'Organik' items are biodegradable and come from natural sources like food scraps, leaves, or paper.
        - 'Anorganik' items are non-biodegradable and synthetic, such as plastic, metal, or glass.
        
        If the item does not fit into either category, or if it is a name or something irrelevant, respond with 'Unknown'.
        
        Examples:
        - Banana peel -> Organik
        - Plastic bottle -> Anorganik
        - Glass jar -> Anorganik
        - Michael -> Unknown
      `;
  
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().toLowerCase().trim();
  
      console.log('AI Response:', text); // Log the response for debugging
  
      let classification = 'Unknown';
  
      // More robust keyword matching
      if (/\borganik\b/.test(text)) {
        classification = 'Organik';
      } else if (/\banorganik\b/.test(text)) {
        classification = 'Anorganik';
      }
  
      res.json({ classification });
    } catch (error) {
      console.error('Error with AI classification:', error);
      res.status(500).json({ error: 'Error with AI classification' });
    }
  });

  // Add classified data to the database
router.post('/add-classified', async (req, res) => {
  const { name, classification_id, description, image } = req.body;

  try {
    const sql = 'INSERT INTO trash (name, classification_id, description, image) VALUES (?, ?, ?, ?)';
    const values = [name, classification_id, description, image];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting classified data:', err);
        res.status(500).json({ error: 'Failed to add data to database' });
      } else {
        res.json({ message: 'Classified data successfully added to the database', id: result.insertId });
      }
    });
  } catch (error) {
    console.error('Unexpected error adding classified data:', error);
    res.status(500).json({ error: 'Unexpected error' });
  }
});
  

module.exports = router;
