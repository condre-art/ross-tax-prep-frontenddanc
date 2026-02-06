# Quick Deployment Guide

## First Time Setup (5 minutes)

### 1. Get Cloudflare Credentials

**Account ID:**
- Go to https://dash.cloudflare.com
- Click "Pages" → Find Account ID in URL or sidebar

**API Token:**
- Go to https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token"
- Use "Edit Cloudflare Workers" template
- Copy token (shown only once!)

### 2. Add Secrets to GitHub

- Go to your repo → Settings → Secrets and variables → Actions
- Add two secrets:
  - `CLOUDFLARE_API_TOKEN` = your API token
  - `CLOUDFLARE_ACCOUNT_ID` = your account ID

### 3. Deploy!

**Option A - Automatic:**
```bash
git push origin main
```

**Option B - Manual:**
1. Go to Actions tab in GitHub
2. Click "Deploy to Production"
3. Click "Run workflow"

## That's it! 🎉

Your site will be live at: `https://ross-tax-prep.pages.dev`

---

**Need more details?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Custom domains
- Environment variables
- Post-deployment configuration
- Troubleshooting
- Rollback procedures
