#!/bin/bash

# VPS Setup Script for E-commerce Multi-Frontend Deployment
# Run this script on your VPS as root or with sudo

set -e

echo "🚀 Starting VPS setup for e-commerce project..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y curl wget git unzip software-properties-common ufw

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx

# Create web directories
echo "📁 Creating web directories..."
mkdir -p /var/www/html/{customer-frontend,admin-frontend,superadmin-frontend}
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force reload

# Setup SSH key for deployment (optional - you can add your key manually)
echo "🔑 Setting up SSH for deployment..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create a deployment user (optional)
echo "👤 Creating deployment user..."
useradd -m -s /bin/bash deploy || true
usermod -aG www-data deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chown deploy:deploy /home/deploy/.ssh

# Install database (PostgreSQL example)
echo "🗄️ Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Create database user and database
echo "🗄️ Setting up database..."
sudo -u postgres createuser --createdb --login deploy || true
sudo -u postgres createdb ecomm_db || true
sudo -u postgres psql -c "ALTER USER deploy PASSWORD 'your_secure_password';"

# Setup log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/ecomm << EOF
/var/www/html/*/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Setup monitoring (basic)
echo "📊 Setting up basic monitoring..."
apt install -y htop iotop ncdu

# Create systemd service for health checks
cat > /etc/systemd/system/health-check.service << EOF
[Unit]
Description=Health Check Service
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/usr/bin/curl -f http://localhost/ > /dev/null 2>&1 || exit 1
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable health-check

echo "✅ VPS setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the nginx.conf to /etc/nginx/sites-available/your-domain.conf"
echo "2. Run: ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/"
echo "3. Test nginx config: nginx -t"
echo "4. Reload nginx: systemctl reload nginx"
echo "5. Get SSL certificate: certbot --nginx -d your-domain.com"
echo "6. Add your SSH public key to ~/.ssh/authorized_keys and /home/deploy/.ssh/authorized_keys"
echo "7. Set up GitHub Secrets: VPS_HOST, VPS_USER, SSH_PRIVATE_KEY"
echo "8. Push to main branch to trigger deployment"
echo ""
echo "🔒 Security reminders:"
echo "- Change default passwords"
echo "- Keep system updated"
echo "- Monitor logs regularly"
echo "- Use fail2ban for SSH protection"