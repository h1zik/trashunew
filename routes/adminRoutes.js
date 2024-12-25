const express = require('express');
const db = require('../models/db');
const router = express.Router();
const path = require('path');
const multer = require('multer');


// Create Classification
router.post('/classifications', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO classifications (name) VALUES (?)', [name], (err) => {
    if (err) {
      console.error('Error adding classification:', err);
      return res.status(500).send('Error adding classification');
    }
    res.send('Classification added successfully');
  });
});

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where images will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with original extension
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Route to handle adding trash with image upload
router.post('/trash', upload.single('image'), (req, res) => {
  const { name, classification_id, description } = req.body;
  const image = req.file ? req.file.path : null; // Get the uploaded file's filename

  db.query(
    'INSERT INTO trash (name, classification_id, description, image) VALUES (?, ?, ?, ?)',
    [name, classification_id, description, image],
    (err) => {
      if (err) {
        console.error('Error adding trash:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json({ message: 'Trash added successfully!' });
    }
  );
});

// Route to update trash with optional image upload
router.put('/trash/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, classification_id, description } = req.body;
  const image = req.file ? req.file.path : null;

  let query = 'UPDATE trash SET name = ?, classification_id = ?, description = ?';
  let params = [name, classification_id, description];

  if (image) {
    query += ', image = ?';
    params.push(image);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.query(query, params, (err) => {
    if (err) {
      console.error('Error updating trash:', err);
      return res.status(500).json({ error: 'Error updating trash' });
    }
    res.json({ message: 'Trash updated successfully' });
  });
});

// Delete Trash
router.delete('/trash/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM trash WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting trash:', err);
      return res.status(500).json({ error: 'Error deleting trash' });
    }
    res.json({ message: 'Trash deleted successfully' }); // Ensure the response is JSON
  });
});


// Set Schedule
router.post('/schedules', (req, res) => {
  const { classification_id, schedule_date } = req.body;
  db.query('INSERT INTO schedules (classification_id, schedule_date) VALUES (?, ?)', [classification_id, schedule_date], (err) => {
    if (err) return res.status(500).send('Error setting schedule');
    res.send('Schedule set successfully');
  });
});

router.get('/dashboard', (req, res) => {
    db.query('SELECT * FROM classifications', (err, results) => {
      if (err) return res.status(500).send('Error fetching classifications');
  
      res.sendFile(path.join(__dirname, '../views/admin_dashboard.html'), { classifications: results });
    });
  });

  router.get('/api/classifications', (req, res) => {
    db.query('SELECT * FROM classifications', (err, results) => {
      if (err) return res.status(500).json({ error: 'Error fetching classifications' });
      res.json(results);
    });
  });
  
// Serve Add Data Page
router.get('/add-data', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/add_data.html'));
  });
  
  // Serve Manage Data Page
  router.get('/manage-data', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/manage_data.html'));
  });
  
  // Serve Schedule Page
  router.get('/schedules', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/schedule.html'));
  });

// Fetch all trash with classification names, description, and images
router.get('/api/trash', (req, res) => {
  const query = `
    SELECT 
      trash.id, 
      trash.name, 
      trash.classification_id, 
      trash.description, 
      trash.image,            -- Added image field here
      classifications.name AS classification_name
    FROM trash
    JOIN classifications ON trash.classification_id = classifications.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching trash data' });
    }
    res.json(results);
  });
});

  
// Fetch all schedules with classification names
router.get('/api/schedules', (req, res) => {
  const query = `
    SELECT schedules.id, schedules.schedule_date, classifications.name AS classification_name
    FROM schedules
    JOIN classifications ON schedules.classification_id = classifications.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching schedules' });
    }
    res.json(results);
  });
});

// Serve Schedule List Page
router.get('/schedule-list', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/schedule_list.html'));
});

  
  

module.exports = router;
