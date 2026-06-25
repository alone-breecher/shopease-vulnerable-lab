# ShopEase - Testing & Verification Checklist

Use this checklist to verify all vulnerabilities are working correctly before deploying for students.

## 🚀 Pre-Testing Setup

- [ ] Docker is installed and running
- [ ] Services started: `docker compose up -d`
- [ ] All containers running: `docker compose ps`
- [ ] Application accessible at http://localhost
- [ ] Database initialized (wait 30-60 seconds after first start)

---

## 🔐 A01: Broken Access Control

### IDOR - Order Details
- [ ] Register two test accounts
- [ ] Place orders from both accounts
- [ ] Login as User A, note your order ID (e.g., #11)
- [ ] Visit `/orders/1` through `/orders/10`
- [ ] **Expected**: Can view orders from other users
- [ ] **Impact**: Privacy breach, PII exposure

### Price Manipulation
- [ ] Add expensive product to cart (iPhone - ₹159,900)
- [ ] Navigate to checkout page
- [ ] Open DevTools (F12) → Elements
- [ ] Find `data-price="159900"` and change to `data-price="1"`
- [ ] Complete checkout with address
- [ ] Check order confirmation
- [ ] **Expected**: Order total shows ₹1
- [ ] **Impact**: Financial fraud

### Mass Assignment - Privilege Escalation
- [ ] Login as regular user (not admin)
- [ ] Open DevTools → Console
- [ ] Execute:
```javascript
fetch('/profile/update', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({role: 'admin'})
}).then(r => r.json()).then(console.log);
```
- [ ] Refresh page
- [ ] **Expected**: "Admin Panel" link appears in navbar
- [ ] Can access `/zevon-admin`
- [ ] **Impact**: Unauthorized admin access

---

## 🔑 A02: Cryptographic Failures

### Plain Text Passwords
- [ ] Login as admin: `admin@shopease.in` / `admin123`
- [ ] Navigate to Admin Panel → Users
- [ ] **Expected**: Password column shows plain text passwords
- [ ] Can see all user passwords: `password123`, `user1234`, etc.
- [ ] **Impact**: Database breach = all accounts compromised

### Session Data in URL
- [ ] Login as any user
- [ ] Observe redirect URL after login
- [ ] **Expected**: URL contains `?user=email@example.com&role=user`
- [ ] Sensitive session info exposed in URL
- [ ] **Impact**: Information disclosure via logs

### Weak Session Configuration
- [ ] Login and open DevTools → Application → Cookies
- [ ] Find `connect.sid` cookie
- [ ] Open Console and type: `document.cookie`
- [ ] **Expected**: Session cookie is readable by JavaScript
- [ ] `httpOnly` flag is false
- [ ] **Impact**: XSS can steal session tokens

---

## 💉 A03: Injection Attacks

### SQL Injection - Login Bypass
- [ ] Navigate to `/login`
- [ ] Email: `' OR '1'='1' --`
- [ ] Password: `anything`
- [ ] Click Login
- [ ] **Expected**: Successfully logged in as admin
- [ ] Redirected to products page
- [ ] **Impact**: Authentication bypass

### SQL Injection - Product Search
- [ ] Navigate to `/products`
- [ ] Search: `' OR '1'='1' --`
- [ ] **Expected**: All products displayed
- [ ] Search: `'` (single quote)
- [ ] **Expected**: SQL error message visible
- [ ] Error reveals query structure
- [ ] **Impact**: Database enumeration

### UNION-Based SQL Injection
- [ ] Navigate to `/products`
- [ ] Search: `' UNION SELECT 1,email,password,4,5,6 FROM users --`
- [ ] **Expected**: User emails/passwords appear as "products"
- [ ] **Impact**: Data exfiltration

### Stored XSS - Contact Form
- [ ] Navigate to `/contact`
- [ ] Fill form:
  - Name: `Test User`
  - Email: `test@test.com`
  - Subject: `Test`
  - Message: `<script>alert('XSS')</script>`
- [ ] Submit form
- [ ] Login as admin
- [ ] Admin Panel → Messages
- [ ] **Expected**: Alert popup appears
- [ ] **Impact**: Session hijacking, admin account takeover

### Reflected XSS - Product Search
- [ ] Navigate to: `/products?search=<script>alert(document.domain)</script>`
- [ ] **Expected**: Alert popup (may be blocked by browser XSS filter)
- [ ] Try: `/products?search=<img src=x onerror=alert(1)>`
- [ ] **Impact**: Session theft via crafted links

---

## 🏗️ A04: Insecure Design

### No Rate Limiting - Brute Force
- [ ] Open Burp Suite and configure proxy
- [ ] Navigate to `/login` in browser through Burp
- [ ] Enter any credentials and click Login
- [ ] In Burp, send request to Intruder
- [ ] Set password as payload position
- [ ] Load password list (10+ passwords)
- [ ] Start attack
- [ ] **Expected**: All requests processed without throttling
- [ ] No lockout after failed attempts
- [ ] **Impact**: Brute force attacks possible

### Password Reset Without Verification
- [ ] Open Postman or curl
- [ ] Send POST to `/reset-password`:
```bash
curl -X POST http://localhost/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@gmail.com","new_password":"hacked123"}'
```
- [ ] **Expected**: Password changed without email verification
- [ ] Login with new password works
- [ ] **Impact**: Account takeover without authentication

---

## ⚙️ A05: Security Misconfiguration

### Debug Endpoint Exposure
- [ ] Visit: `http://localhost/api/debug`
- [ ] **Expected**: JSON response with:
  - Database credentials
  - Session secret
  - Environment variables
- [ ] **Impact**: Full system compromise

### robots.txt Disclosure
- [ ] Visit: `http://localhost/robots.txt`
- [ ] **Expected**: Shows hidden paths:
  - `/zevon-admin`
  - `/api/debug`
  - `/api/users`
- [ ] **Impact**: Reconnaissance aid for attackers

### Verbose Error Messages
- [ ] Visit: `/products?search='`
- [ ] **Expected**: Full SQL error message displayed
- [ ] Shows query structure and table names
- [ ] **Impact**: Information disclosure for SQL injection

---

## 📦 A06: Vulnerable & Outdated Components

### NPM Audit
- [ ] Run: `docker compose exec app npm audit`
- [ ] **Expected**: Multiple vulnerabilities reported
- [ ] Known CVEs in express, ejs, mysql2
- [ ] **Impact**: Exploitable known vulnerabilities

---

## 🔐 A07: Authentication Failures

### No Account Lockout
- [ ] Attempt login with wrong password 20 times
- [ ] **Expected**: No lockout, no CAPTCHA
- [ ] All attempts processed
- [ ] **Impact**: Unlimited brute force attempts

### Weak Password Policy
- [ ] Register new account with password: `a`
- [ ] **Expected**: Registration succeeds
- [ ] 1-character password accepted
- [ ] **Impact**: Weak passwords allowed

---

## 📝 A08: Data Integrity Failures

### Mass Assignment (Already tested in A01)
- [ ] Verify `/profile/update` accepts arbitrary fields
- [ ] Can send `role`, `email`, any user table column
- [ ] **Impact**: Privilege escalation

---

## 📊 A09: Logging & Monitoring Failures

### No Login Failure Logging
- [ ] Attempt login with wrong password 10 times
- [ ] Check logs: `docker compose logs app`
- [ ] **Expected**: No failed login attempts logged
- [ ] No alerts or notifications
- [ ] **Impact**: Attacks go undetected

---

## 🌐 A10: Server-Side Request Forgery

### SSRF via Image URL
- [ ] Login as admin
- [ ] Admin Panel → Products → Add Product
- [ ] Fill form with:
  - Name: `Test Product`
  - Description: `Test`
  - Price: `100`
  - Stock: `10`
  - Category: `Test`
  - Image URL: `http://localhost:3000/api/debug`
- [ ] Submit form
- [ ] Check logs: `docker compose logs app | grep -A 5 "Fetched image"`
- [ ] **Expected**: Internal API response logged
- [ ] Server fetched internal URL
- [ ] **Impact**: Internal network access

### SSRF - Port Scanning
- [ ] Try Image URL: `http://db:3306`
- [ ] Try: `http://localhost:22`
- [ ] Try: `http://localhost:6379`
- [ ] Check logs for connection attempts
- [ ] **Expected**: Server attempts connections
- [ ] **Impact**: Internal port scanning

---

## ✅ Functional Testing

### User Registration
- [ ] Register new account
- [ ] **Expected**: Redirected to login
- [ ] Can login with new credentials

### Product Browsing
- [ ] Visit `/products`
- [ ] **Expected**: 20 products displayed
- [ ] Product search works

### Shopping Cart
- [ ] Add products to cart
- [ ] **Expected**: Cart badge shows count
- [ ] Cart page displays items

### Checkout Flow
- [ ] Complete checkout (before price manipulation)
- [ ] **Expected**: Order created
- [ ] Visible in "My Orders"

### Admin Panel
- [ ] Login as admin
- [ ] **Expected**: All admin sections accessible:
  - Dashboard (stats)
  - Users (list)
  - Orders (all)
  - Products (management)
  - Messages (contact forms)

---

## 🎯 Exploitation Chain Test

### Full Attack Path
- [ ] 1. Recon: `robots.txt` → Discover admin panel
- [ ] 2. SQL Injection: Login as admin
- [ ] 3. XSS: Plant payload in contact form
- [ ] 4. Wait for real admin to view messages
- [ ] 5. IDOR: Enumerate all customer orders
- [ ] 6. Price Manipulation: Buy products for ₹1
- [ ] 7. SSRF: Scan internal network
- [ ] **Expected**: All steps successful in sequence

---

## 📋 Documentation Verification

- [ ] README.md is accurate
- [ ] QUICKSTART.md works as written
- [ ] DEPLOY.md instructions are complete
- [ ] MODULES.md maps to actual vulnerabilities
- [ ] INSTRUCTOR_NOTES.md exploitation steps work
- [ ] BUILD_SUMMARY.md is up to date

---

## 🔧 Infrastructure Testing

### Docker Services
- [ ] `docker compose ps` shows all services healthy
- [ ] `docker compose logs nginx` shows no errors
- [ ] `docker compose logs app` shows "ShopEase running"
- [ ] `docker compose logs db` shows "ready for connections"

### Database Connection
- [ ] Run: `docker compose exec db mysql -u shopease_user -pshopease_pass shopease`
- [ ] **Expected**: MySQL prompt appears
- [ ] Query: `SELECT COUNT(*) FROM users;`
- [ ] **Expected**: Returns 6

### Port Accessibility
- [ ] Port 80 accessible: `curl http://localhost`
- [ ] Port 3000 accessible: `curl http://localhost:3000`
- [ ] MySQL port 3306 accessible from app container

---

## 🚨 Known Limitations

These are expected behaviors (not bugs):
- [ ] Browser XSS filters may block reflected XSS (use Burp or disable filters)
- [ ] Session logout has 30-second bug (intentional)
- [ ] No images display (placeholders only - intentional)
- [ ] SSRF results appear in logs only (expected)
- [ ] npm audit shows many vulnerabilities (intentional)

---

## ✅ Sign-Off

Testing completed by: _______________  
Date: _______________  
Environment: [ ] Local [ ] VPS  
All tests passed: [ ] Yes [ ] No  

Notes:
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🎓 Post-Testing

After successful testing:
1. [ ] Reset database: `docker compose down -v && docker compose up -d`
2. [ ] Take VPS snapshot (if on VPS)
3. [ ] Document any discovered issues
4. [ ] Update INSTRUCTOR_NOTES.md if needed
5. [ ] Deploy for students

---

**Estimated Testing Time**: 45-60 minutes for full checklist

**Pro Tip**: Use Burp Suite for all tests to build a complete HTTP history for reference during course delivery.
