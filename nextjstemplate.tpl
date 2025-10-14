#=========================================================================#
# Next.js Web Domain Template for dev.davcreations.in                    #
# DO NOT MODIFY THIS FILE! CHANGES WILL BE LOST WHEN REBUILDING DOMAINS #
# https://hestiacp.com/docs/server-administration/web-templates.html     #
#=========================================================================#

server {
    listen %ip%:%proxy_port%;
    server_name %domain_idn% %alias_idn%;
    error_log /var/log/apache2/domains/%domain%.error.log error;

    # Increase client max body size for file uploads
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Next.js proxy configuration
    # Change this port to match your Next.js app port (default: 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Next.js specific headers
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeout settings for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # WebSocket support for Next.js Hot Reload
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static assets optimization
    location /_next/static/ {
        alias /home/%user%/web/%domain%/public_html/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Next.js public static files
    location /static/ {
        alias /home/%user%/web/%domain%/public_html/public/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Favicon and common files
    location = /favicon.ico {
        alias /home/%user%/web/%domain%/public_html/public/favicon.ico;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location = /robots.txt {
        alias /home/%user%/web/%domain%/public_html/public/robots.txt;
        expires 1d;
        access_log off;
    }

    # Health check endpoint (optional)
    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}
