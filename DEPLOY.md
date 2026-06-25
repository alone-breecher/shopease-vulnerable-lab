# ShopEase - VPS Deployment Guide

This guide will help you deploy the ShopEase vulnerable lab application to a VPS running Ubuntu 22.04.

## Prerequisites

- VPS with Ubuntu 22.04 LTS
- Root or sudo access
- At least 2GB RAM
- Public IP address

## Step 1: Connect to Your VPS

```bash
ssh root@your_vps_ip
# or
ssh your_user@your_vps_ip
```

## Step 2: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 3: Install Docker

```bash
# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Verify Docker installation
sudo docker --version
```

## Step 4: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

## Step 5: Upload ShopEase Application

### Option A: Using Git (Recommended)

```bash
# Install git
sudo apt install -y git

# Clone or upload your repository
git clone <your-repo-url> /opt/shopease
cd /opt/shopease
```

### Option B: Using SCP

From your local machine:

```bash
scp -r ./shopease root@your_vps_ip:/opt/
ssh root@your_vps_ip
cd /opt/shopease
```

## Step 6: Start the Application

```bash
cd /opt/shopease

# Start all services
sudo docker-compose up -d

# Check if containers are running
sudo docker-compose ps

# View logs
sudo docker-compose logs -f
```

## Step 7: Configure Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 8: Verify Deployment

1. Open your browser and navigate to: `http://your_vps_ip`
2. You should see the ShopEase homepage
3. Admin panel: `http://your_vps_ip/zevon-admin`
4. Admin credentials: `admin@shopease.in` / `admin123`

## Step 9: Access Application Routes

- **Homepage/Products**: `http://your_vps_ip/products`
- **Login**: `http://your_vps_ip/login`
- **Register**: `http://your_vps_ip/register`
- **Cart**: `http://your_vps_ip/cart`
- **Contact**: `http://your_vps_ip/contact`
- **Admin Panel**: `http://your_vps_ip/zevon-admin`
- **Debug Endpoint**: `http://your_vps_ip/api/debug`
- **Robots.txt**: `http://your_vps_ip/robots.txt`

## Useful Commands

### View Container Logs
```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f app
sudo docker-compose logs -f db
```

### Restart Services
```bash
sudo docker-compose restart
```

### Stop Services
```bash
sudo docker-compose down
```

### Rebuild After Changes
```bash
sudo docker-compose down
sudo docker-compose up --build -d
```

### Access MySQL Database
```bash
sudo docker-compose exec db mysql -u shopease_user -pshopease_pass shopease
```

### Check Disk Space
```bash
df -h
sudo docker system df
```

### Clean Up Docker Resources
```bash
# Remove unused images
sudo docker image prune -a

# Remove unused volumes
sudo docker volume prune

# Remove everything unused
sudo docker system prune -a
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
sudo docker-compose logs app
sudo docker-compose logs db

# Restart services
sudo docker-compose restart
```

### Database Connection Issues
```bash
# Wait for MySQL to initialize (first start takes ~30 seconds)
sudo docker-compose logs db | grep "ready for connections"

# Check if database container is running
sudo docker-compose ps db
```

### Port Already in Use
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop the conflicting service
sudo systemctl stop apache2  # or nginx
```

### Permission Denied Errors
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
```

## Security Notes

**IMPORTANT**: This is an intentionally vulnerable application for educational purposes.

- Do NOT expose this to the public internet without proper isolation
- Use a separate VPS or VM dedicated to this lab
- Consider using VPN access for students
- Monitor access logs regularly
- Take snapshots before student sessions

## Auto-Start on Reboot

```bash
# Create systemd service
sudo nano /etc/systemd/system/shopease.service
```

Add this content:

```ini
[Unit]
Description=ShopEase Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/shopease
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable shopease.service
sudo systemctl start shopease.service
```

## Monitoring

### Check Application Health
```bash
curl http://localhost/products
curl http://localhost/api/debug
```

### Monitor Resource Usage
```bash
# Real-time container stats
sudo docker stats

# System resources
htop
```

## Backup and Restore

### Backup Database
```bash
sudo docker-compose exec db mysqldump -u shopease_user -pshopease_pass shopease > backup.sql
```

### Restore Database
```bash
sudo docker-compose exec -T db mysql -u shopease_user -pshopease_pass shopease < backup.sql
```

## Support

For issues or questions:
- Check application logs: `sudo docker-compose logs -f`
- Check container status: `sudo docker-compose ps`
- Restart services: `sudo docker-compose restart`
- Review CLAUDE.md for architecture details
