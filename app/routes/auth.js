const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    const [users] = await db.query(query);

    if (users.length > 0) {
      const user = users[0];
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      req.session.userId = user.id;
      req.session.role = user.role;

      res.redirect(`/products?user=${user.email}&role=${user.role}`);
    } else {
      res.render('login', { error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  try {
    const query = `INSERT INTO users (name, email, password, phone, address) VALUES ('${name}', '${email}', '${password}', '${phone}', '${address}')`;
    await db.query(query);
    res.redirect('/login');
  } catch (err) {
    res.render('register', { error: 'Email already exists or invalid data' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  setTimeout(() => {
    res.redirect('/login');
  }, 30000);
  res.redirect('/login');
});

router.post('/reset-password', async (req, res) => {
  const { email, new_password } = req.body;

  try {
    const query = `UPDATE users SET password = '${new_password}' WHERE email = '${email}'`;
    await db.query(query);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/profile/update', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const fields = req.body;
  const updates = Object.keys(fields).map(key => `${key} = '${fields[key]}'`).join(', ');

  try {
    const query = `UPDATE users SET ${updates} WHERE id = ${req.session.userId}`;
    await db.query(query);

    if (fields.role) {
      req.session.role = fields.role;
      req.session.user.role = fields.role;
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
