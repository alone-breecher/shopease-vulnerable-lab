# ShopEase - Intentionally Vulnerable E-commerce Application

![License](https://img.shields.io/badge/license-Educational-blue.svg)
![OWASP](https://img.shields.io/badge/OWASP-Top%2010-red.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

ShopEase is an intentionally vulnerable web application designed for **ZevonAI's Website Penetration Testing Using AI** course. It simulates a realistic Indian e-commerce platform with deliberately introduced security vulnerabilities mapped to the OWASP Top 10.

## ⚠️ Legal Disclaimer

**THIS APPLICATION IS INTENTIONALLY INSECURE**

- **For educational purposes only**
- **Do NOT deploy to public internet without proper isolation**
- **Do NOT use any code patterns from this project in production**
- Unauthorized testing on systems you don't own is illegal
- Use only in controlled lab environments

## 🎯 Purpose

This vulnerable application serves as a hands-on learning platform for:
- Penetration testing students
- Security awareness training
- OWASP Top 10 demonstrations
- Secure coding workshops
- AI-assisted vulnerability discovery

## 🏗️ Architecture

```
┌─────────────┐
│   Nginx     │ :80 (Reverse Proxy)
└──────┬──────┘
       │
┌──────▼──────┐
│   Node.js   │ :3000 (Express App)
│   + EJS     │
└──────┬──────┘
       │
┌──────▼──────┐
│   MySQL     │ :3306 (Database)
└─────────────┘
```

**Tech Stack:**
- Backend: Node.js + Express.js
- Frontend: EJS templates + Bootstrap 5
- Database: MySQL 8.0
- Deployment: Docker + Docker Compose
- Proxy: Nginx

## 📋 Features

**E-commerce Functionality:**
- Product catalog with categories
- Shopping cart system
- User registration and authentication
- Order management
- Contact form
- Admin panel (hidden at `/zevon-admin`)

**Vulnerable Components (OWASP Top 10):**
- **A01**: Broken Access Control (IDOR, price manipulation)
- **A02**: Cryptographic Failures (plain text passwords)
- **A03**: Injection (SQL injection, XSS)
- **A04**: Insecure Design (no rate limiting, weak password reset)
- **A05**: Security Misconfiguration (debug endpoints, verbose errors)
- **A06**: Vulnerable Components (outdated dependencies)
- **A07**: Auth Failures (weak passwords, session issues)
- **A08**: Integrity Failures (mass assignment)
- **A09**: Logging Failures (no audit trail)
- **A10**: SSRF (unvalidated URL fetch)

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd shopease
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Verify deployment**
```bash
docker-compose ps
```

4. **Access the application**
- Homepage: `http://localhost`
- Admin Panel: `http://localhost/zevon-admin`

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shopease.in | admin123 |
| User | rajesh@gmail.com | password123 |
| User | priya.sharma@yahoo.com | user1234 |

## 📚 Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Architecture and development guidance
- **[DEPLOY.md](DEPLOY.md)** - VPS deployment instructions
- **[MODULES.md](MODULES.md)** - Course module to vulnerability mapping
- **[INSTRUCTOR_NOTES.md](INSTRUCTOR_NOTES.md)** - Detailed exploitation guides

## 🎓 Course Integration

This application is designed for structured learning:

1. **Reconnaissance** - Discover hidden endpoints via robots.txt
2. **Authentication Attacks** - SQL injection, brute force
3. **Authorization Bypass** - IDOR vulnerabilities
4. **Injection Attacks** - SQL injection and XSS
5. **Business Logic Flaws** - Price manipulation
6. **Information Disclosure** - Debug endpoints, plain text passwords
7. **Server-Side Attacks** - SSRF exploitation

Each vulnerability includes:
- Step-by-step exploitation guide
- Vulnerable code examples
- Secure remediation patterns
- Impact assessment

## 🔧 Development

### Project Structure
```
shopease/
├── docker-compose.yml       # Service orchestration
├── nginx/
│   └── default.conf         # Reverse proxy config
├── app/
│   ├── server.js            # Express application
│   ├── db.js                # Database connection
│   ├── routes/              # Route handlers (vulnerabilities here)
│   ├── views/               # EJS templates
│   └── public/              # Static assets
└── db/
    └── init.sql             # Database schema + seed data
```

### Useful Commands

```bash
# View logs
docker-compose logs -f app

# Restart application
docker-compose restart app

# Reset database
docker-compose down -v
docker-compose up -d

# Access MySQL
docker-compose exec db mysql -u shopease_user -pshopease_pass shopease

# Run npm audit (shows intentional vulnerabilities)
docker-compose exec app npm audit
```

## 🎯 Testing Vulnerabilities

### Quick Verification Tests

**1. SQL Injection (Login Bypass)**
```
Email: ' OR '1'='1' --
Password: anything
```

**2. IDOR (Order Access)**
```
Navigate to: /orders/1, /orders/2, etc.
```

**3. XSS (Contact Form)**
```
Message: <script>alert('XSS')</script>
```

**4. Price Manipulation**
```
DevTools → Edit hidden price field → Checkout
```

**5. Debug Endpoint**
```
Visit: /api/debug
```

## 🛡️ Security Notes

**Intentional Vulnerabilities:**
- All passwords stored in plain text
- No input validation or sanitization
- SQL queries use string concatenation
- No CSRF protection
- Weak session configuration
- No rate limiting
- Verbose error messages
- Outdated npm packages

**DO NOT:**
- Use any code from this project in production
- Deploy to public internet without VPN/firewall
- Store real user data in this application
- Use these patterns as reference for secure development

## 📊 Application Statistics

- **Products**: 20 electronics items
- **Default Users**: 6 (1 admin, 5 regular)
- **Sample Orders**: 10
- **Discount Codes**: 3
- **Vulnerable Endpoints**: 15+
- **OWASP Categories Covered**: 10/10

## 🤝 Contributing

This is an educational project. Contributions should maintain the intentionally vulnerable nature:

1. New vulnerabilities must map to OWASP Top 10
2. Include exploitation guide in INSTRUCTOR_NOTES.md
3. Update MODULES.md with course integration
4. Maintain realistic e-commerce appearance
5. No "CTF-style" obvious vulnerabilities

## 📝 License

This project is for **educational purposes only**. See LICENSE file for details.

## 🙏 Acknowledgments

- OWASP Foundation for security education resources
- WebGoat and DVWA for inspiration
- ZevonAI for course development

## 📞 Support

For course-related questions:
- Email: support@zevonai.com
- Documentation: See DEPLOY.md and INSTRUCTOR_NOTES.md

## 🔒 Ethical Usage

By using this application, you agree to:
- Use only in authorized educational environments
- Not deploy to production or public networks
- Follow responsible disclosure for any real vulnerabilities found
- Respect computer fraud and abuse laws in your jurisdiction

---

**Remember**: Real-world testing without authorization is illegal. Always practice ethical hacking. 🎓🔐
