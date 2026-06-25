const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/orders', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const query = `SELECT * FROM orders WHERE user_id = ${req.session.userId} ORDER BY created_at DESC`;
    const [orders] = await db.query(query);
    res.render('orders', { orders });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/orders/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const { id } = req.params;

  try {
    const orderQuery = `SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ${id}`;
    const [orders] = await db.query(orderQuery);

    if (orders.length === 0) {
      return res.status(404).send('Order not found');
    }

    const itemsQuery = `SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ${id}`;
    const [items] = await db.query(itemsQuery);

    res.render('order-detail', { order: orders[0], items });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
