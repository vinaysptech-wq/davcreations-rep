#!/bin/bash

# Secure SSH Setup for GitHub Actions Deployment
# Run this on your VPS as root

set -e

echo "🔐 Setting up secure SSH for GitHub Actions deployment..."

# Create deploy user if it doesn't exist
if ! id "deploy" &>/dev/null; then
    echo "👤 Creating deploy user..."
    useradd -m -s /bin/bash deploy
    usermod -aG www-data deploy
fi

# Create SSH directory for deploy user
DEPLOY_HOME="/home/deploy"
SSH_DIR="$DEPLOY_HOME/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
chown deploy:deploy "$SSH_DIR"

# Generate SSH key pair for deploy user
echo "🔑 Generating SSH key pair for deploy user..."
sudo -u deploy ssh-keygen -t ed25519 -C "deploy@davcreation.in" -f "$SSH_DIR/id_ed25519" -N ""

# Display public key for GitHub Secrets
echo ""
echo "📋 Copy this PUBLIC KEY to your GitHub repository secrets as 'SSH_PRIVATE_KEY':"
echo "=================================================================================="
cat "$SSH_DIR/id_ed25519"
echo "=================================================================================="
echo ""

# Add public key to authorized_keys
cat "$SSH_DIR/id_ed25519.pub" >> "$SSH_DIR/authorized_keys"
chmod 600 "$SSH_DIR/authorized_keys"
chown deploy:deploy "$SSH_DIR/authorized_keys"

# Create web directories and set permissions
echo "📁 Setting up web directories..."
mkdir -p /var/www/davcreations.in/{customer-frontend,admin-frontend,superadmin-frontend}
chown -R deploy:www-data /var/www/davcreations.in
chmod -R 755 /var/www/davcreations.in

# Configure sudo for deploy user (passwordless for specific commands)
echo "⚡ Configuring sudo permissions for deploy user..."
cat > /etc/sudoers.d/deploy << EOF
deploy ALL=(ALL) NOPASSWD: /usr/sbin/service nginx reload
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
deploy ALL=(ALL) NOPASSWD: /usr/bin/pm2 restart *
EOF
chmod 440 /etc/sudoers.d/deploy

# Disable password authentication for SSH (keep key-based only)
echo "🔒 Hardening SSH configuration..."
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH service
systemctl reload sshd

echo ""
echo "✅ SSH setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the private key above to GitHub Secrets as 'SSH_PRIVATE_KEY'"
echo "2. Set these GitHub Secrets:"
echo "   - VPS_HOST: 168.231.102.158"
echo "   - VPS_USER: deploy"
echo "   - SSH_PRIVATE_KEY: (the key shown above)"
echo ""
echo "3. Test the connection:"
echo "   ssh -i ~/.ssh/deploy_key deploy@168.231.102.158"
echo ""
echo "4. Copy nginx-simple.conf to /etc/nginx/sites-available/davcreation.in"
echo "5. Enable site: ln -s /etc/nginx/sites-available/davcreation.in /etc/nginx/sites-enabled/"
echo "6. Test: nginx -t && systemctl reload nginx"
echo ""
echo "⚠️  WARNING: SSH password authentication has been disabled!"
echo "   Make sure your SSH key works before closing this session."