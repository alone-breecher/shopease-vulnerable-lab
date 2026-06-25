const express = require('express');
const router = express.Router();
const db = require('../db');
const fetch = require('node-fetch');

function checkAdmin(req, res, next) {
  if (req.session.role === 'admin') {
    next();
  } else {
    res.status(403).send('Access denied');
  }
}

router.get('/', checkAdmin, async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
    const [orderCount] = await db.query('SELECT COUNT(*) as count FROM orders');
    const [revenue] = await db.query('SELECT SUM(total) as total FROM orders');
    const [recentOrders] = await db.query('SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10');

    res.render('admin/dashboard', {
      userCount: userCount[0].count,
      orderCount: orderCount[0].count,
      revenue: revenue[0].total || 0,
      recentOrders
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/users', checkAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.render('admin/users', { users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/orders', checkAdmin, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
    res.render('admin/orders', { orders });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/products', checkAdmin, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.render('admin/products', { products });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/products/add', checkAdmin, async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;

  try {
    if (image_url && image_url.startsWith('http')) {
      const response = await fetch(image_url);
      console.log(`Fetched image from ${image_url}: ${response.status}`);
    }

    const query = `INSERT INTO products (name, description, price, stock, category, image_url) VALUES ('${name}', '${description}', ${price}, ${stock}, '${category}', '${image_url}')`;
    await db.query(query);
    res.redirect('/zevon-admin/products');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/products/delete', checkAdmin, async (req, res) => {
  const { id } = req.body;

  try {
    await db.query(`DELETE FROM products WHERE id = ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/messages', checkAdmin, async (req, res) => {
  try {
    const [messages] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.render('admin/messages', { messages });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
