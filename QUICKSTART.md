# ShopEase - Quick Start Guide

Get the vulnerable lab running in 5 minutes! 🚀

## Prerequisites

- Docker Desktop installed
- Terminal/Command Prompt access
- 2GB free RAM

## Step 1: Navigate to Project

```bash
cd /path/to/shopease
```

## Step 2: Start All Services

```bash
docker compose up -d
```

Wait 30-60 seconds for MySQL to initialize.

## Step 3: Verify Services

```bash
docker compose ps
```

You should see 3 services running:
- ✅ nginx (port 80)
- ✅ app (port 3000)
- ✅ db (port 3306)

## Step 4: Access the Application

Open your browser:

**Main Application:**
```
http://localhost
```

**Admin Panel (Hidden):**
```
http://localhost/zevon-admin
```

**Debug Endpoint (Vulnerability):**
```
http://localhost/api/debug
```

## Step 5: Login

**Admin Account:**
- Email: `admin@shopease.in`
- Password: `admin123`

**Regular User:**
- Email: `rajesh@gmail.com`
- Password: `password123`

## Quick Vulnerability Tests

### 1. SQL Injection (2 minutes)
1. Go to http://localhost/login
2. Email: `' OR '1'='1' --`
3. Password: `anything`
4. Click Login → ✅ Bypassed authentication!

### 2. IDOR (1 minute)
1. Login as any user
2. Place an order
3. Go to My Orders → Click any order
4. Change URL from `/orders/11` to `/orders/1`
5. ✅ Viewing other users' orders!

### 3. XSS (2 minutes)
1. Go to http://localhost/contact
2. Message field: `<script>alert('XSS')</script>`
3. Submit form
4. Login as admin → Admin Panel → Messages
5. ✅ XSS payload executes!

### 4. Price Manipulation (2 minutes)
1. Add expensive product to cart (iPhone - ₹159,900)
2. Go to checkout
3. Press F12 → Elements tab
4. Find `data-price="159900"` and change to `data-price="1"`
5. Complete checkout
6. ✅ Paid ₹1 instead of ₹159,900!

### 5. Information Disclosure (30 seconds)
1. Visit: http://localhost/api/debug
2. ✅ Database credentials exposed!

### 6. Plain Text Passwords (1 minute)
1. Login as admin
2. Admin Panel → Users
3. ✅ All passwords visible!

## Troubleshooting

### Services won't start
```bash
# Check if ports are in use
lsof -i :80
lsof -i :3306

# Restart services
docker compose restart
```

### Database connection errors
```bash
# Wait for MySQL to initialize (check logs)
docker compose logs db

# Look for: "ready for connections"
```

### Can't access on port 80
```bash
# Use port 3000 directly
http://localhost:3000
```

### Reset everything
```bash
# Stop and remove all data
docker compose down -v

# Start fresh
docker compose up -d
```

## Useful Commands

```bash
# View application logs
docker compose logs -f app

# View all logs
docker compose logs -f

# Stop services
docker compose down

# Restart a service
docker compose restart app

# Access database
docker compose exec db mysql -u shopease_user -pshopease_pass shopease

# Check npm vulnerabilities
docker compose exec app npm audit
```

## Next Steps

1. **Read MODULES.md** - Complete vulnerability mapping
2. **Read INSTRUCTOR_NOTES.md** - Detailed exploitation guides
3. **Read DEPLOY.md** - VPS deployment for remote access
4. **Practice systematically** - Work through each OWASP Top 10 category

## Key Routes

| Route | Purpose | Vulnerability |
|-------|---------|---------------|
| `/` | Homepage | - |
| `/products` | Product listing | SQL Injection, XSS |
| `/product/:id` | Product detail | - |
| `/login` | Authentication | SQL Injection |
| `/register` | New account | Weak validation |
| `/cart` | Shopping cart | - |
| `/checkout` | Payment | Price manipulation |
| `/orders` | User orders | - |
| `/orders/:id` | Order detail | IDOR |
| `/contact` | Contact form | Stored XSS |
| `/zevon-admin` | Admin panel | Hidden, SSRF |
| `/api/debug` | Debug info | Info disclosure |
| `/robots.txt` | Recon | Path disclosure |

## Learning Path

### Beginner (Day 1)
1. ✅ SQL Injection on login
2. ✅ IDOR on orders
3. ✅ Information disclosure via /api/debug

### Intermediate (Day 2)
4. ✅ Stored XSS via contact form
5. ✅ Price manipulation at checkout
6. ✅ Mass assignment (privilege escalation)

### Advanced (Day 3)
7. ✅ UNION-based SQL injection on search
8. ✅ SSRF via admin image upload
9. ✅ Session hijacking via XSS

## Important Reminders

⚠️ **This is an INTENTIONALLY vulnerable application**
- Only use in isolated environments
- Never deploy to public internet
- Never use these patterns in production code
- Always get authorization before testing

✅ **This is for EDUCATION only**
- Practice ethical hacking
- Understand vulnerabilities deeply
- Learn to write secure code
- Use knowledge responsibly

## Help & Resources

- **Full Documentation**: See README.md
- **Deployment Guide**: See DEPLOY.md
- **Module Mapping**: See MODULES.md
- **Instructor Guide**: See INSTRUCTOR_NOTES.md

## Support

Having issues?
1. Check logs: `docker compose logs -f`
2. Verify services: `docker compose ps`
3. Reset database: `docker compose down -v && docker compose up -d`
4. Check Docker is running: `docker version`

---

**Ready to learn? Start hacking! 🎓🔐**

Time to exploitation: ~5 minutes  
Vulnerabilities available: 15+  
OWASP Top 10 coverage: 10/10
