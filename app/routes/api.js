const express = require('express');
const router = express.Router();
const db = require('../db');

// API endpoint - Get current user info
router.get('/api/me', async (req, res) => {
  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  // Check if user is authenticated
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required. Please login first.'
    });
  }

  try {
    // Vulnerable: SQL injection via session userId (if compromised)
    const query = `SELECT id, name, email, role, phone, address, profile_picture, created_at FROM users WHERE id = ${req.session.userId}`;
    const [users] = await db.query(query);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = users[0];

    // Vulnerable: Returns sensitive information
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profile_picture: user.profile_picture,
        member_since: user.created_at,
        session_id: req.sessionID  // Vulnerable: Exposes session ID
      }
    });
  } catch (err) {
    // Vulnerable: Exposes error details
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack  // Vulnerable: Stack trace exposure
    });
  }
});

// Vulnerable: List all users - NO authentication check
router.get('/api/users', async (req, res) => {
  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    // Vulnerable: No authentication or authorization check
    // Vulnerable: Exposes all user data including passwords
    const query = 'SELECT id, name, email, password, role, phone, address, created_at FROM users';
    const [users] = await db.query(query);

    res.json({
      success: true,
      count: users.length,
      data: users  // Vulnerable: Returns plain text passwords
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Vulnerable: Get specific user - IDOR vulnerability
router.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  // Vulnerable: No authentication check
  // Vulnerable: No authorization check (can view any user)

  try {
    // Vulnerable: SQL injection via id parameter
    const query = `SELECT id, name, email, password, role, phone, address, profile_picture, created_at FROM users WHERE id = ${id}`;
    const [users] = await db.query(query);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Vulnerable: Returns plain text password
    res.json({
      success: true,
      data: users[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      query: `SELECT * FROM users WHERE id = ${id}`  // Vulnerable: Query disclosure
    });
  }
});

// Vulnerable: Search users - SQL injection
router.get('/api/users/search', async (req, res) => {
  const { q } = req.query;

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Search query parameter "q" is required'
    });
  }

  try {
    // Vulnerable: SQL injection via search parameter
    const query = `SELECT id, name, email, role FROM users WHERE name LIKE '%${q}%' OR email LIKE '%${q}%'`;
    const [users] = await db.query(query);

    res.json({
      success: true,
      count: users.length,
      query: query,  // Vulnerable: Query disclosure
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      sql_error: err.sqlMessage  // Vulnerable: SQL error disclosure
    });
  }
});

// Get all products API
router.get('/api/products', async (req, res) => {
  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    const query = 'SELECT * FROM products';
    const [products] = await db.query(query);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Get specific product API - SQL injection
router.get('/api/product/:id', async (req, res) => {
  const { id } = req.params;

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    // Vulnerable: SQL injection
    const query = `SELECT * FROM products WHERE id = ${id}`;
    const [products] = await db.query(query);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Vulnerable: Get user orders - IDOR
router.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  // Vulnerable: No check if logged-in user matches userId
  // Anyone can view anyone's orders

  try {
    const query = `SELECT * FROM orders WHERE user_id = ${userId}`;
    const [orders] = await db.query(query);

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Server info endpoint - Information disclosure
router.get('/api/info', (req, res) => {
  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.json({
    success: true,
    data: {
      app: 'ShopEase',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      node_version: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      // Vulnerable: Exposes sensitive configuration
      database: {
        host: process.env.DB_HOST,
        name: process.env.DB_NAME,
        user: process.env.DB_USER
      },
      session_secret: process.env.SESSION_SECRET
    }
  });
});

// API documentation endpoint
router.get('/api', (req, res) => {
  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.json({
    success: true,
    message: 'ShopEase API v1.0',
    endpoints: [
      {
        method: 'GET',
        path: '/api/me',
        description: 'Get current authenticated user info',
        auth_required: true
      },
      {
        method: 'GET',
        path: '/api/users',
        description: 'List all users',
        auth_required: false,
        note: 'Returns passwords in plain text'
      },
      {
        method: 'GET',
        path: '/api/user/:id',
        description: 'Get specific user by ID',
        auth_required: false,
        vulnerable: 'IDOR, SQL Injection'
      },
      {
        method: 'GET',
        path: '/api/users/search?q=query',
        description: 'Search users by name or email',
        auth_required: false,
        vulnerable: 'SQL Injection'
      },
      {
        method: 'GET',
        path: '/api/products',
        description: 'List all products'
      },
      {
        method: 'GET',
        path: '/api/product/:id',
        description: 'Get specific product',
        vulnerable: 'SQL Injection'
      },
      {
        method: 'GET',
        path: '/api/orders/:userId',
        description: 'Get user orders',
        vulnerable: 'IDOR - No authorization check'
      },
      {
        method: 'GET',
        path: '/api/info',
        description: 'Server information',
        vulnerable: 'Information Disclosure'
      }
    ]
  });
});

module.exports = router;
