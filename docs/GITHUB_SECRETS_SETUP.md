# GitHub Secrets Setup Guide

This guide provides specific examples and instructions for setting up GitHub Secrets for automatic deployment.

## Required GitHub Secrets

### 1. DEPLOY_HOST

**What it is:** The IP address or hostname of your deployment server.

**Examples:**
```
# IP Address
192.168.1.100

# Hostname
myserver.example.com

# Domain name
deploy.yourdomain.com
```

**How to get it:**
```bash
# On your server, check IP address
hostname -I

# Or check public IP
curl ifconfig.me

# Or use your server's hostname
hostname
```

**Format:** Just the IP or hostname, no `http://` or port numbers.

---

### 2. DEPLOY_USER

**What it is:** The SSH username for your server.

**Common examples:**
```
# Ubuntu/Debian servers
ubuntu

# CentOS/RHEL servers
centos
root

# Custom user
deploy
admin
your-username
```

**How to find it:**
```bash
# On your server, check current user
whoami

# Or check available users
cat /etc/passwd | grep /bin/bash
```

**Format:** Just the username, nothing else.

---

### 3. DEPLOY_SSH_KEY

**What it is:** Your private SSH key for authentication.

**How to generate (if you don't have one):**

**On your local machine:**
```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "github-deploy-key" -f ~/.ssh/github_deploy_key

# This creates two files:
# ~/.ssh/github_deploy_key      (private key - use this for GitHub Secret)
# ~/.ssh/github_deploy_key.pub  (public key - add to server)
```

**Copy the PRIVATE key content:**
```bash
# Display the private key (copy this entire output)
cat ~/.ssh/github_deploy_key
```

**Add public key to your server:**
```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@your-server-ip

# Or manually add to server:
ssh user@your-server-ip
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**Example private key format:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAy8... (many more lines)
-----END OPENSSH PRIVATE KEY-----
```

**Important:** Copy the ENTIRE key including the `-----BEGIN` and `-----END` lines.

---

## Step-by-Step Setup Instructions

### Step 1: Prepare Your Server

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (if not already installed)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deployment directory
sudo mkdir -p /opt/natural-speech
cd /opt/natural-speech

# Clone repository (first time only)
sudo git clone https://github.com/williamDalston/natural-speech.git .

# Create docker-compose.prod.yml
sudo cp docker-compose.yml docker-compose.prod.yml
```

### Step 2: Generate SSH Key (on your local machine)

```bash
# Generate deployment key
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy_key

# When prompted, press Enter for no passphrase (or set one if preferred)
# This creates:
# Private key: ~/.ssh/github_deploy_key
# Public key:  ~/.ssh/github_deploy_key.pub
```

### Step 3: Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub ubuntu@YOUR_SERVER_IP

# Replace 'ubuntu' with your actual username
# Replace YOUR_SERVER_IP with your actual server IP
```

### Step 4: Test SSH Connection

```bash
# Test connection (should work without password)
ssh -i ~/.ssh/github_deploy_key ubuntu@YOUR_SERVER_IP

# If successful, you're ready to proceed
```

### Step 5: Get Your Values

**DEPLOY_HOST:**
```bash
# Your server IP or hostname
# Example: 192.168.1.100 or myserver.com
```

**DEPLOY_USER:**
```bash
# The username you used above
# Example: ubuntu
```

**DEPLOY_SSH_KEY:**
```bash
# Display and copy the entire private key
cat ~/.ssh/github_deploy_key

# Copy everything from -----BEGIN to -----END
```

### Step 6: Add Secrets to GitHub

1. Go to your repository: `https://github.com/williamDalston/natural-speech`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

**Add each secret:**

**Secret 1: DEPLOY_HOST**
- Name: `DEPLOY_HOST`
- Value: `192.168.1.100` (your actual IP/hostname)

**Secret 2: DEPLOY_USER**
- Name: `DEPLOY_USER`
- Value: `ubuntu` (your actual username)

**Secret 3: DEPLOY_SSH_KEY**
- Name: `DEPLOY_SSH_KEY`
- Value: (paste entire private key from `cat ~/.ssh/github_deploy_key`)

### Step 7: Verify Setup

After adding secrets, push to main branch:

```bash
git push origin main
```

Then check GitHub Actions:
- Go to **Actions** tab
- You should see "Deploy" workflow running
- Check logs to verify deployment

---

## Example Values (Template)

Replace with your actual values:

```
DEPLOY_HOST=203.0.113.42
DEPLOY_USER=ubuntu
DEPLOY_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAy8... (full key content)
-----END OPENSSH PRIVATE KEY-----
```

---

## Troubleshooting

### SSH Connection Fails

```bash
# Test connection manually
ssh -i ~/.ssh/github_deploy_key DEPLOY_USER@DEPLOY_HOST

# Check permissions
chmod 600 ~/.ssh/github_deploy_key
chmod 644 ~/.ssh/github_deploy_key.pub

# Verify public key is on server
ssh DEPLOY_USER@DEPLOY_HOST "cat ~/.ssh/authorized_keys"
```

### Deployment Fails

1. Check GitHub Actions logs for specific errors
2. Verify server has Docker installed: `docker --version`
3. Verify user has Docker permissions: `sudo usermod -aG docker $USER`
4. Check server logs: `journalctl -u docker`

### Permission Denied

```bash
# On server, ensure user can run docker
sudo usermod -aG docker $USER
newgrp docker

# Test docker access
docker ps
```

---

## Security Best Practices

1. **Use a dedicated deployment user** (not root)
2. **Restrict SSH key** to only deployment commands
3. **Use key with passphrase** for extra security
4. **Rotate keys regularly**
5. **Monitor deployment logs**

---

## Quick Reference

| Secret Name | Example Value | How to Get |
|------------|---------------|------------|
| `DEPLOY_HOST` | `192.168.1.100` | Server IP or hostname |
| `DEPLOY_USER` | `ubuntu` | SSH username |
| `DEPLOY_SSH_KEY` | `-----BEGIN...` | Private SSH key file content |

---

**Need help?** Check the deployment logs in GitHub Actions or review the [Deployment Guide](DEPLOYMENT_FROM_GITHUB.md).

