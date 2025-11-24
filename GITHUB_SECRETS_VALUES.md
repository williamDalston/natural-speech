# GitHub Secrets - Ready to Add

## ✅ SSH Keys Generated Successfully!

Your SSH keys have been created at:
- **Private Key**: `~/.ssh/github_deploy_natural_speech`
- **Public Key**: `~/.ssh/github_deploy_natural_speech.pub`

---

## 🔑 GitHub Secrets to Add

Go to: **https://github.com/williamDalston/natural-speech/settings/secrets/actions**

Click **"New repository secret"** for each one:

---

### 1. DEPLOY_HOST

**Secret Name:** `DEPLOY_HOST`

**Value:** 
```
[YOUR_SERVER_IP_OR_HOSTNAME]
```

**Examples:**
- `192.168.1.100`
- `203.0.113.42`
- `myserver.example.com`

**How to get it:**
```bash
# SSH into your server and run:
hostname -I
```

---

### 2. DEPLOY_USER

**Secret Name:** `DEPLOY_USER`

**Value:**
```
[YOUR_SSH_USERNAME]
```

**Common values:**
- `ubuntu` (for Ubuntu servers)
- `centos` (for CentOS servers)
- `root` (if using root user)
- `deploy` (custom user)

**How to find it:**
```bash
# SSH into your server and run:
whoami
```

---

### 3. DEPLOY_SSH_KEY

**Secret Name:** `DEPLOY_SSH_KEY`

**Value:** (Copy the ENTIRE key below - including BEGIN and END lines)

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCXyootBr07x2Dg/rh/8c6BVBN2W23D10faP0ep4o425wAAAKAN7oivDe6I
rwAAAAtzc2gtZWQyNTUxOQAAACCXyootBr07x2Dg/rh/8c6BVBN2W23D10faP0ep4o425w
AAAEAFO26R7EYdc+rMO3MaKAAyQ/PPHzooPZ1b3auF8eeajZfKii0GvTvHYOD+uH/xzoFU
E3ZbbcPXR9o/R6nijjbnAAAAHGdpdGh1Yi1kZXBsb3ktbmF0dXJhbC1zcGVlY2gB
-----END OPENSSH PRIVATE KEY-----
```

⚠️ **IMPORTANT:** Copy the ENTIRE key above, including the `-----BEGIN` and `-----END` lines!

---

## 📋 Next Steps

### Step 1: Add Public Key to Your Server

Before adding secrets to GitHub, add the public key to your server:

```bash
# Replace YOUR_USER and YOUR_SERVER_IP with your actual values
ssh-copy-id -i ~/.ssh/github_deploy_natural_speech.pub YOUR_USER@YOUR_SERVER_IP
```

**Or manually:**

1. Copy this public key:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJfKii0GvTvHYOD+uH/xzoFUE3ZbbcPXR9o/R6nijjbn github-deploy-natural-speech
   ```

2. SSH into your server:
   ```bash
   ssh YOUR_USER@YOUR_SERVER_IP
   ```

3. Add the key:
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJfKii0GvTvHYOD+uH/xzoFUE3ZbbcPXR9o/R6nijjbn github-deploy-natural-speech" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

### Step 2: Test SSH Connection

```bash
# Test that the key works
ssh -i ~/.ssh/github_deploy_natural_speech YOUR_USER@YOUR_SERVER_IP
```

If this works without asking for a password, you're ready!

### Step 3: Add Secrets to GitHub

1. Go to: **https://github.com/williamDalston/natural-speech/settings/secrets/actions**
2. Click **"New repository secret"**
3. Add each secret:
   - Name: `DEPLOY_HOST` → Value: Your server IP
   - Name: `DEPLOY_USER` → Value: Your username
   - Name: `DEPLOY_SSH_KEY` → Value: The entire private key above

### Step 4: Verify

After adding secrets, push to main:
```bash
git push origin main
```

Then check GitHub Actions to see the deployment workflow run!

---

## 🔒 Security Note

**After adding secrets to GitHub, delete this file for security:**
```bash
rm GITHUB_SECRETS_VALUES.md
```

The private key is stored securely in `~/.ssh/github_deploy_natural_speech` - keep that file secure!

---

## 📝 Quick Reference

| Secret Name | Example Value | Where to Get |
|------------|---------------|--------------|
| `DEPLOY_HOST` | `192.168.1.100` | Server IP from `hostname -I` |
| `DEPLOY_USER` | `ubuntu` | Username from `whoami` on server |
| `DEPLOY_SSH_KEY` | `-----BEGIN...` | Private key above (full content) |

---

**Your keys are ready! Just fill in your server IP and username, then add to GitHub Secrets.**

