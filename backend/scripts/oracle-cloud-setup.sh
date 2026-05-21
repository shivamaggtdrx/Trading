#!/bin/bash
# ══════════════════════════════════════════════════════════════
# StocksLab — Oracle Cloud VM Setup Script
# Run this on a fresh Ubuntu 22.04/24.04 VM (Oracle Cloud Always Free)
#
# Usage: chmod +x oracle-cloud-setup.sh && sudo ./oracle-cloud-setup.sh
# ══════════════════════════════════════════════════════════════

set -e

echo "══════════════════════════════════════════════════"
echo "  StocksLab — Oracle Cloud Server Setup"
echo "══════════════════════════════════════════════════"

# ── 1. System Update ──
echo ""
echo "📦 [1/7] Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ── 2. Install Node.js 20.x ──
echo ""
echo "📦 [2/7] Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "   Node.js version: $(node -v)"
echo "   npm version: $(npm -v)"

# ── 3. Install PM2 globally ──
echo ""
echo "📦 [3/7] Installing PM2 process manager..."
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu
echo "   PM2 installed: $(pm2 -v)"

# ── 4. Install Nginx ──
echo ""
echo "📦 [4/7] Installing Nginx..."
apt-get install -y nginx

# ── 5. Configure Nginx as reverse proxy ──
echo ""
echo "⚙️  [5/7] Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/stockslab << 'NGINX_CONF'
# StocksLab Backend — Nginx Reverse Proxy
# Proxies HTTP/HTTPS traffic to Node.js on port 4000
# Includes WebSocket upgrade support for Socket.IO

server {
    listen 80;
    server_name _;  # Replace with your domain: server_name api.stockslab.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy all traffic to Node.js
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # ── WebSocket support (required for Socket.IO) ──
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for long-lived WebSocket connections
        proxy_read_timeout 86400s;   # 24 hours
        proxy_send_timeout 86400s;
    }

    # Health check — bypass proxy for monitoring
    location /health {
        proxy_pass http://127.0.0.1:4000/health;
        access_log off;
    }
}
NGINX_CONF

# Enable the site and remove default
ln -sf /etc/nginx/sites-available/stockslab /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "   Nginx configured and running ✓"

# ── 6. Configure Firewall (iptables for Oracle Cloud) ──
echo ""
echo "🔒 [6/7] Configuring firewall rules..."
# Oracle Cloud uses iptables, not ufw
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save 2>/dev/null || iptables-save > /etc/iptables/rules.v4
echo "   Ports 80, 443 opened ✓"

# ── 7. Create app directory ──
echo ""
echo "📁 [7/7] Creating application directory..."
mkdir -p /home/ubuntu/stockslab
chown -R ubuntu:ubuntu /home/ubuntu/stockslab
echo "   Directory /home/ubuntu/stockslab created ✓"

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Server setup complete!"
echo "══════════════════════════════════════════════════"
echo ""
echo "  Next steps (run as 'ubuntu' user, NOT root):"
echo ""
echo "  1. Clone your repo:"
echo "     cd /home/ubuntu/stockslab"
echo "     git clone https://github.com/YOUR_USER/YOUR_REPO.git ."
echo ""
echo "  2. Install backend dependencies:"
echo "     cd backend"
echo "     npm install --production"
echo ""
echo "  3. Create your .env file:"
echo "     cp .env.example .env"
echo "     nano .env    # Fill in production values"
echo ""
echo "  4. Start with PM2:"
echo "     mkdir -p logs"
echo "     pm2 start ecosystem.config.cjs"
echo "     pm2 save"
echo ""
echo "  5. (Optional) Add SSL with Let's Encrypt:"
echo "     sudo apt install -y certbot python3-certbot-nginx"
echo "     sudo certbot --nginx -d api.yourdomain.com"
echo ""
echo "══════════════════════════════════════════════════"
