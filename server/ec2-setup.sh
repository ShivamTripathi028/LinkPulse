#!/bin/bash
# ==============================================================================
# LinkPulse URL Shortener - AWS EC2 Free Tier (Ubuntu 22.04 / 24.04 LTS)
# Automated Provisioning & Deployment Script
# ==============================================================================

set -e

echo "=== [1/6] Updating System & Installing Essentials ==="
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw nginx certbot python3-certbot-nginx

echo "=== [2/6] Configuring Firewall (UFW) ==="
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "=== [3/6] Installing Docker & Docker Compose ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo rm get-docker.sh
fi

echo "=== [4/6] Setting Up Environment Variables ==="
if [ ! -f .env ]; then
    cat <<EOT >> .env
DATABASE_URL="postgresql://linkpulse_user:$(openssl rand -hex 16)@db:5432/linkpulse_db"
ALLOWED_ORIGINS="*"
EOT
    echo "Generated secure .env file"
fi

echo "=== [5/6] Building and Starting Containers ==="
sudo docker compose down --remove-orphans || true
sudo docker compose up --build -d

echo "=== [6/6] Pushing Prisma Schema to Database ==="
echo "Waiting for PostgreSQL container to be healthy..."
sleep 8
sudo docker compose exec -T api prisma db push --schema=./prisma/schema.prisma

echo ""
echo "=========================================================================="
echo " SUCCESS! LinkPulse FastAPI + Prisma Backend is running on port 8000"
echo " Test with: curl http://localhost:8000/health"
echo " Nginx reverse proxy configuration can now be linked in /etc/nginx/sites-available/"
echo "=========================================================================="
