const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/products', async (req, res) => {
  const search = req.query.search || '';

  try {
    let query;
    if (search) {
      query = `SELECT * FROM products WHERE name LIKE '%${search}%' OR description LIKE '%${search}%' OR category LIKE '%${search}%'`;
    } else {
      query = 'SELECT * FROM products';
    }

    const [products] = await db.query(query);
    res.render('products', { products, search });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/product/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT * FROM products WHERE id = ${id}`;
    const [products] = await db.query(query);

    if (products.length === 0) {
      return res.status(404).send('Product not found');
    }

    const relatedQuery = `SELECT * FROM products WHERE category = '${products[0].category}' AND id != ${id} LIMIT 4`;
    const [related] = await db.query(relatedQuery);

    res.render('product-detail', { product: products[0], related });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
