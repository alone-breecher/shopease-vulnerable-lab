const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: false,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

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
