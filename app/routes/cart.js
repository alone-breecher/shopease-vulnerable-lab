const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  res.render('cart', { cart });
});

router.post('/cart/add', async (req, res) => {
  const { product_id, quantity } = req.body;

  try {
    const [products] = await db.query(`SELECT * FROM products WHERE id = ${product_id}`);

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = products[0];

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const existingItem = req.session.cart.find(item => item.id === parseInt(product_id));

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      req.session.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: parseInt(quantity),
        image_url: product.image_url
      });
    }

    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/cart/remove', (req, res) => {
  const { product_id } = req.body;

  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.id !== parseInt(product_id));
  }

  res.json({ success: true });
});

router.get('/checkout', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.redirect('/cart');
  }

  res.render('checkout', { cart });
});

router.post('/checkout', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const { address, items } = req.body;
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  try {
    let total = 0;
    const parsedItems = JSON.parse(items);

    parsedItems.forEach(item => {
      total += parseFloat(item.price) * parseInt(item.quantity);
    });

    const orderQuery = `INSERT INTO orders (user_id, total, status, address) VALUES (${req.session.userId}, ${total}, 'Processing', '${address}')`;
    const [orderResult] = await db.query(orderQuery);

    const orderId = orderResult.insertId;

    for (const item of parsedItems) {
      const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (${orderId}, ${item.id}, ${item.quantity}, ${item.price})`;
      await db.query(itemQuery);
    }

    req.session.cart = [];

    res.json({ success: true, order_id: orderId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
