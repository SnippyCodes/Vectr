# Vectr — Production Deployment Guide

**Monthly cost: ~$3.55/mo | Credit runway: ~28 months on $100**

---

## Prerequisites

- AWS account with Lightsail access + $100 credits
- Domain name (buy from Namecheap/Porkbun, ~$10/yr — NOT Route 53)
- Cloudflare free account
- Vercel free account
- GitHub repo with this codebase

---

## Step 1: AWS Account Hardening (do this FIRST)

1. **Enable MFA** on root: AWS Console → top-right → Security Credentials → MFA
2. **Set billing alert**: CloudWatch → Alarms → Create Alarm → `EstimatedCharges > 5 USD` → email
3. **Create IAM user** `vectr-backup` (for S3 only):
   - IAM → Users → Create → Programmatic access only
   - Attach inline policy:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
         "Resource": [
           "arn:aws:s3:::vectr-production-backups",
           "arn:aws:s3:::vectr-production-backups/*"
         ]
       }]
     }
     ```
   - Save Access Key ID + Secret Key → go to Step 3

---

## Step 2: AWS Lightsail Provisioning

1. Go to https://lightsail.aws.amazon.com
2. Create instance:
   - OS Only → **Ubuntu 24.04 LTS**
   - Plan: **$3.50/month** (1 GB / 1 vCPU / 40 GB / 1 TB transfer)
   - Name: `vectr-backend-prod`
3. Attach **Static IP**: Networking → Create static IP → attach to instance (free)
4. **Firewall** (Networking tab):
   - Allow TCP 80 (HTTP)
   - Allow TCP 443 (HTTPS)
   - Allow TCP 22 — **restrict to your IP** (not 0.0.0.0/0)
5. Download SSH key (.pem file)

---

## Step 3: AWS S3 Backup Bucket

1. S3 → Create bucket: `vectr-production-backups`
2. Region: same as Lightsail instance
3. **Block all public access** ✓ (leave all 4 checkboxes checked)
4. Enable **Versioning**: Bucket → Properties → Versioning → Enable
5. Enable **Server-side encryption**: Bucket → Properties → Default encryption → SSE-S3
6. **Lifecycle rule**: Bucket → Management → Lifecycle rules → Create:
   - Name: `expire-old-backups`
   - Scope: entire bucket
   - Action: Delete objects → 365 days after creation
   - Action: Transition to Glacier → 30 days after creation

---

## Step 4: Server Setup (SSH in)

```bash
# Connect via SSH
ssh -i your-lightsail-key.pem ubuntu@YOUR_STATIC_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install AWS CLI
sudo apt install -y awscli

# Configure AWS CLI with IAM user credentials
aws configure
# AWS Access Key ID: (paste from Step 1)
# AWS Secret Access Key: (paste from Step 1)
# Default region: us-east-1
# Output format: json

# Clone your repo
sudo mkdir -p /opt/vectr
sudo chown ubuntu:ubuntu /opt/vectr
git clone https://github.com/YOUR_USERNAME/vectr.git /opt/vectr
cd /opt/vectr

# Create secrets directory (NOT in git)
mkdir -p secrets
openssl rand -base64 32 > secrets/db_password.txt
chmod 600 secrets/db_password.txt

# Create production env file (NOT in git)
cp backend/.env.example backend/.env.prod
nano backend/.env.prod
# Fill in: GROQ_API_KEY, GEMINI_API_KEY, ENCRYPTION_KEY, FIREBASE_API_KEY,
#          GITHUB_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET
# DB vars are set in docker-compose.prod.yml — no need to set ENDPOINT here

# Set up daily backup cron (2am UTC every day)
chmod +x scripts/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/vectr/scripts/backup.sh >> /var/log/vectr-backup.log 2>&1") | crontab -

# Launch the stack!
docker compose -f docker-compose.prod.yml up -d

# Verify everything is running
docker compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health
# Should return: {"status": "healthy", "service": "Vectr API", "version": "1.0.0"}
```

---

## Step 5: Cloudflare DNS Setup

1. Add your domain to Cloudflare (free plan)
2. Update nameservers at your registrar to Cloudflare's
3. Add DNS records in Cloudflare:
   | Type | Name | Value | Proxy |
   |------|------|-------|-------|
   | A | `api` | `YOUR_LIGHTSAIL_STATIC_IP` | ✓ Proxied |
   | CNAME | `@` (root) | `cname.vercel-dns.com` | ✓ Proxied |
   | CNAME | `www` | `cname.vercel-dns.com` | ✓ Proxied |
4. SSL/TLS → set to **Full (Strict)**
5. Security → Bot Fight Mode → **On** (free DDoS protection)

---

## Step 6: Edit Caddyfile with your domain

```bash
# On the server:
nano /opt/vectr/Caddyfile
# Change: api.vectropensource.me → your actual API subdomain

# Restart Caddy to pick up the change and issue SSL cert
docker compose -f docker-compose.prod.yml restart caddy

# Verify HTTPS (takes ~60 seconds for cert issuance)
curl https://api.yourdomain.com/health
```

---

## Step 7: Vercel Frontend Deploy

1. Go to https://vercel.com → Import GitHub repo
2. Set **Root Directory** → `frontend/vectr-app`
3. Set **Environment Variables**:
   - `VITE_API_URL` = `https://api.yourdomain.com`
4. Deploy → add your custom domain in Vercel project Settings → Domains

---

## Step 8: GitHub Actions CI/CD Secrets

In your GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|---|---|
| `LIGHTSAIL_HOST` | Your Lightsail static IP |
| `LIGHTSAIL_SSH_KEY` | Contents of your .pem file (the whole file including headers) |

Now every `git push origin main` will:
- Automatically deploy frontend via Vercel
- Automatically SSH into Lightsail and rebuild backend containers

---

## Verify Everything Works

```bash
# From your local machine after full deployment:
curl https://api.yourdomain.com/health        # API alive
curl https://api.yourdomain.com/docs          # Swagger UI loads
curl -I https://yourdomain.com                # Frontend loads with HTTP/2

# On the server — test backup
/opt/vectr/scripts/backup.sh
aws s3 ls s3://vectr-production-backups/postgres/  # Should show .sql.gz file
```

---

## Monthly Cost Verification

After 1 month, check:
- AWS Console → Billing → Bills → should show ≤ $4.00
- If > $5: check for accidentally created RDS/EC2/NAT Gateway instances and delete them

---

## Upgrading the Server (when you outgrow $3.50/mo)

When Vectr has real traffic and 1 GB RAM isn't enough:
1. Take a Lightsail snapshot
2. Create new $10/mo instance (2 GB RAM) from the snapshot
3. Move static IP to new instance
4. Zero downtime, all data preserved
