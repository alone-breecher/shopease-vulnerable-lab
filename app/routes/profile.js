const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Vulnerable file upload configuration - NO FILE TYPE VALIDATION
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Vulnerable: uploads go to public directory - directly accessible
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // Vulnerable: uses original filename without sanitization
    // Allows directory traversal, overwrites, etc.
    cb(null, file.originalname);
  }
});

// Vulnerable: No file size limit, no file type restrictions
const upload = multer({
  storage: storage
  // INTENTIONALLY MISSING:
  // - fileFilter (no extension check)
  // - limits (no size limit)
});

// Profile page
router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    const query = `SELECT * FROM users WHERE id = ${req.session.userId}`;
    const [users] = await db.query(query);

    if (users.length === 0) {
      return res.redirect('/login');
    }

    res.render('profile', { user: users[0], success: null, error: null });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Vulnerable profile picture upload
router.post('/profile/upload', upload.single('profile_picture'), async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  if (!req.file) {
    return res.redirect('/profile?error=No file uploaded');
  }

  try {
    // Vulnerable: No file extension validation
    // Vulnerable: No MIME type check
    // Vulnerable: Stores original filename in database
    const filename = req.file.originalname;

    // Vulnerable: SQL injection possible through filename
    const query = `UPDATE users SET profile_picture = '${filename}' WHERE id = ${req.session.userId}`;
    await db.query(query);

    // Vulnerable: Reflects filename back to user (XSS)
    res.redirect(`/profile?success=Profile picture uploaded: ${filename}`);
  } catch (err) {
    // Vulnerable: Exposes error details
    res.redirect(`/profile?error=${err.message}`);
  }
});

// View uploaded file - Vulnerable: No access control
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  // Vulnerable: Path traversal - no sanitization
  // Can access: /uploads/../../../etc/passwd
  const filepath = path.join(__dirname, '../public/uploads/', filename);

  // Vulnerable: No content-type forcing
  // PHP/JSP files can execute if server misconfigured
  res.sendFile(filepath);
});

// List all uploads - Vulnerable: Information disclosure
router.get('/profile/uploads', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    const uploadsDir = path.join(__dirname, '../public/uploads/');

    // Vulnerable: Shows all uploaded files, not just user's own
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        return res.status(500).send(err.message);
      }

      res.render('uploads-list', { files });
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
