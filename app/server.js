const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const profileRoutes = require('./routes/profile');
const apiRoutes = require('./routes/api');

const app = express();

// Disable ETags to prevent 304 Not Modified responses
app.set('etag', false);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false
}));

app.use(session({
  name: 'session_id',
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: false,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware to disable caching and ETags globally - must intercept writeHead
app.use((req, res, next) => {
  const _writeHead = res.writeHead.bind(res);

  res.writeHead = function(statusCode, reasonPhrase, headers) {
    // Remove ETag header before writing response
    delete this._headers['etag'];

    if (typeof reasonPhrase === 'object') {
      headers = reasonPhrase;
      reasonPhrase = undefined;
    }

    if (headers) {
      delete headers['etag'];
      delete headers['ETag'];
    }

    // Set cache control headers
    this.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    this.setHeader('Pragma', 'no-cache');
    this.setHeader('Expires', '0');

    return _writeHead(statusCode, reasonPhrase, headers);
  };

  next();
});

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  next();
});

app.get('/', (req, res) => {
  res.redirect('/products');
});

app.use('/', authRoutes);
app.use('/', productsRoutes);
app.use('/', cartRoutes);
app.use('/', ordersRoutes);
app.use('/zevon-admin', adminRoutes);
app.use('/', contactRoutes);
app.use('/', profileRoutes);
app.use('/', apiRoutes);

app.get('/api/debug', (req, res) => {
  res.json({
    env: 'production',
    db_host: process.env.DB_HOST,
    db_user: process.env.DB_USER,
    db_name: process.env.DB_NAME,
    session_secret: process.env.SESSION_SECRET,
    version: '1.0.0'
  });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /zevon-admin
Disallow: /api/debug
Disallow: /api/users`);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const db = require('./db');
    await db.query('SELECT 1');
    console.log('Database connection established');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ShopEase running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err);
    setTimeout(startServer, 5000);
  }
}

startServer();
