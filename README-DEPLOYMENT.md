# E-commerce Project Deployment Guide

This guide covers setting up automated CI/CD for your multi-frontend e-commerce application using GitHub Actions and VPS deployment.

## Project Structure

- `customer-frontend/` - Main customer-facing app (port 3000 → `/`)
- `admin-frontend/` - Admin panel (port 3001 → `/admin-frontend/`)
- `superadmin-frontend/` - Super admin panel (port 3002 → `/superadmin-frontend/`)
- `admin-backend/` & `customer-backend/` - API servers (future implementation)

## Prerequisites

### VPS Requirements
- Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- Domain name pointing to VPS IP
- SSH key pair for deployment

### GitHub Repository
- Private repository recommended
- Branch protection on `main`
- GitHub Secrets configured

## Quick Setup

### 1. VPS Initial Setup

```bash
# On your VPS
wget https://raw.githubusercontent.com/your-repo/main/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

### 2. Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/your-domain.com
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 4. GitHub Secrets

Add these secrets in your GitHub repository:

- `VPS_HOST`: Your VPS IP or domain
- `VPS_USER`: SSH username (e.g., `deploy`)
- `SSH_PRIVATE_KEY`: Private SSH key for deployment

### 5. Deploy

Push to `main` branch or use manual dispatch in GitHub Actions.

## Workflow Details

### CI Pipeline (ci.yml)
- **Triggers**: Push/PR to main, manual dispatch
- **Jobs**:
  - Matrix build for all frontends
  - Node.js caching and dependency installation
  - Linting and testing
  - Security scanning
  - Artifact upload for deployment

### CD Pipeline (deploy.yml)
- **Triggers**: Push to main, manual dispatch with environment selection
- **Jobs**:
  - Download build artifacts
  - SCP deployment to VPS
  - Service restart
  - Health checks
  - Rollback on failure

## Base Path Configuration

The CI pipeline automatically configures base paths:
- Customer frontend: `/` (no base path)
- Admin frontend: `/admin-frontend`
- Superadmin frontend: `/superadmin-frontend`

## Environment Variables

Create `.env.local` files in each frontend directory:

```bash
# customer-frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# admin-frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_BASE_PATH=/admin-frontend

# superadmin-frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_BASE_PATH=/superadmin-frontend
```

## Monitoring & Maintenance

### Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs (if using PM2)
pm2 logs
```

### Updates
```bash
# System updates
sudo apt update && sudo apt upgrade

# SSL renewal
sudo certbot renew
```

### Backup
```bash
# Database backup
pg_dump ecomm_db > backup_$(date +%Y%m%d).sql

# File backup
tar -czf www_backup_$(date +%Y%m%d).tar.gz /var/www/html/
```

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version and dependencies
2. **Deployment fails**: Verify SSH keys and permissions
3. **404 errors**: Check nginx config and base paths
4. **SSL issues**: Ensure certbot configuration

### Health Checks

```bash
# Test all endpoints
curl -I https://your-domain.com/
curl -I https://your-domain.com/admin-frontend/
curl -I https://your-domain.com/superadmin-frontend/
```

## Security Best Practices

- Use strong SSH keys (ed25519 recommended)
- Enable UFW firewall
- Keep dependencies updated
- Use HTTPS everywhere
- Implement rate limiting
- Regular security audits

## Future Enhancements

- Add backend deployment
- Implement blue-green deployment
- Add performance monitoring
- Set up error tracking
- Configure CDN for assets
- Add database migrations

## Support

For issues, check:
1. GitHub Actions logs
2. VPS system logs
3. Nginx error logs
4. Application console logs