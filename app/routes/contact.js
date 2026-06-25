const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/contact', (req, res) => {
  res.render('contact', { success: null });
});

router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    const query = `INSERT INTO contact_messages (name, email, subject, message) VALUES ('${name}', '${email}', '${subject}', '${message}')`;
    await db.query(query);
    res.render('contact', { success: 'Thank you! Your message has been received.' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
