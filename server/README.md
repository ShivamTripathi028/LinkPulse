# LinkPulse Backend — FastAPI + Prisma ORM on AWS EC2 Free Tier

This directory contains the production-ready FastAPI backend with Prisma Python ORM for LinkPulse URL shortener and click analytics.

## Tech Stack
- **FastAPI**: Async, high-throughput Python API with automatic OpenAPI documentation.
- **Prisma Python**: Type-safe relational ORM for PostgreSQL.
- **Docker & Docker Compose**: Automated multi-container orchestration.
- **Nginx & Certbot**: Reverse proxy with automatic free SSL/TLS certificates.

---

## AWS EC2 Free Tier Deployment Guide

### Step 1: Launch an AWS EC2 Instance
1. Go to **AWS Management Console** -> **EC2** -> **Launch Instance**.
2. **Name**: `linkpulse-backend`
3. **OS Image**: `Ubuntu Server 24.04 LTS` or `22.04 LTS` (Free tier eligible).
4. **Instance Type**: `t2.micro` or `t3.micro` (750 hours/month free).
5. **Key Pair**: Select your existing key pair or create a new `.pem` file.
6. **Network Settings**:
   - Check **Allow SSH traffic from Anywhere (0.0.0.0/0)** or your IP.
   - Check **Allow HTTP traffic from the internet (Port 80)**.
   - Check **Allow HTTPS traffic from the internet (Port 443)**.
7. Click **Launch Instance**.

---

### Step 2: Connect to Your EC2 Instance
In your local terminal:
```bash
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

### Step 3: Clone & Run Setup Script
```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd <REPO_FOLDER>/server

# Make setup script executable and run
chmod +x ec2-setup.sh
./ec2-setup.sh
```
This script automatically:
1. Installs Docker, Docker Compose, Git, UFW firewall, and Nginx.
2. Creates the PostgreSQL database container with persistent storage.
3. Builds the FastAPI image and applies `prisma db push`.
4. Exposes the backend at `http://127.0.0.1:8000`.

---

### Step 4: Configure Nginx & SSL (Let's Encrypt)
1. Copy the provided Nginx configuration:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/linkpulse
sudo ln -s /etc/nginx/sites-available/linkpulse /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

2. Edit `/etc/nginx/sites-available/linkpulse` and put your domain (e.g. `api.yourdomain.com`) or public IP:
```bash
sudo nano /etc/nginx/sites-available/linkpulse
sudo nginx -t
sudo systemctl reload nginx
```

3. (Optional with custom domain) Obtain free SSL:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

### Step 5: Test the API
```bash
curl http://<YOUR_EC2_PUBLIC_IP>/health
```
Expected output:
```json
{
  "status": "healthy",
  "database": "connected",
  "engine": "FastAPI + Prisma Python",
  "timestamp": "2026-09-24T..."
}
```

---

### Step 6: Connect with Vercel Frontend
In your Vercel Project Settings -> **Environment Variables**:
```env
VITE_API_URL="https://api.yourdomain.com"
# Or if using raw IP:
VITE_API_URL="http://<YOUR_EC2_PUBLIC_IP>"
```
Now all shortened links and analytics requests in the frontend connect seamlessly to your AWS EC2 instance!
