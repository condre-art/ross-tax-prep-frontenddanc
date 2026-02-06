# Production Deployment Checklist

This checklist ensures all requirements are met before deploying Ross Tax Prep to production.

## Prerequisites Status: Ready ✅

### 1. GitHub Repository Setup ✅
- [x] Repository exists: `condre-art/ross-tax-prep-frontend`
- [x] GitHub Actions enabled
- [x] Production deployment workflow configured (`.github/workflows/deploy-production.yml`)
- [x] Preview deployment workflow configured (`.github/workflows/deploy-preview.yml`)

### 2. Build Configuration ✅
- [x] Next.js configured for static export (`output: "export"`)
- [x] Build script configured: `npm run build`
- [x] Build directory set to `out/`
- [x] Build tested successfully
- [x] Dependencies installed and locked (`package-lock.json`)

### 3. Cloudflare Configuration ✅
- [x] `wrangler.toml` configured with production settings
- [x] Environment set to "production"
- [x] IRS MEF endpoint set to production: `https://prod.irs.gov/mef`
- [x] IRS test mode disabled: `false`
- [x] Project name: `ross-tax-prep`

## Required GitHub Secrets

Before deploying, ensure these secrets are configured in GitHub repository settings:

**Navigation:** Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Required | Status | How to Obtain |
|------------|----------|--------|---------------|
| `CLOUDFLARE_API_TOKEN` | ✅ Yes | ⚠️ Needs Verification | [Get from Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Yes | ⚠️ Needs Verification | [Find in Cloudflare Dashboard](https://dash.cloudflare.com) → Pages |

### Creating Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template OR create custom token with:
   - Permission: Account > Cloudflare Pages > Edit
   - Account Resources: Include > Your Account
4. Click **Continue to summary** → **Create Token**
5. **Copy the token** (shown only once!)
6. Add to GitHub as `CLOUDFLARE_API_TOKEN`

### Finding Cloudflare Account ID

1. Go to https://dash.cloudflare.com
2. Click **Pages** in left sidebar
3. Account ID is in the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/pages`
4. Add to GitHub as `CLOUDFLARE_ACCOUNT_ID`

## Cloudflare Resources Setup

These resources will be needed after initial deployment:

### D1 Database
```bash
wrangler d1 create ross-tax-prep-db
# Copy the database_id to wrangler.toml
```

### KV Namespaces
```bash
# Sessions storage
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview

# Cache storage
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview
# Update wrangler.toml with the namespace IDs
```

### R2 Buckets
```bash
# Production buckets
wrangler r2 bucket create ross-tax-documents
wrangler r2 bucket create ross-client-uploads
wrangler r2 bucket create ross-irs-submissions

# Preview buckets
wrangler r2 bucket create ross-tax-documents-preview
wrangler r2 bucket create ross-client-uploads-preview
wrangler r2 bucket create ross-irs-submissions-preview
```

### Production Secrets

After deployment, set these secrets via Cloudflare Pages dashboard or Wrangler CLI:

```bash
# Security secrets
wrangler pages secret put JWT_SECRET --project-name=ross-tax-prep
wrangler pages secret put ENCRYPTION_KEY --project-name=ross-tax-prep
wrangler pages secret put DB_ENCRYPTION_KEY --project-name=ross-tax-prep
wrangler pages secret put TOTP_SECRET --project-name=ross-tax-prep

# IRS credentials (obtain from IRS e-Services)
wrangler pages secret put IRS_EFIN --project-name=ross-tax-prep
wrangler pages secret put IRS_ETIN --project-name=ross-tax-prep
wrangler pages secret put IRS_CERTIFICATE --project-name=ross-tax-prep
wrangler pages secret put IRS_PRIVATE_KEY --project-name=ross-tax-prep
```

**Generate secrets using:**
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption keys (256-bit)
openssl rand -base64 32
```

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)
When changes are merged to `main` branch, deployment happens automatically via GitHub Actions.

```bash
# Merge to main triggers deployment
git checkout main
git merge your-feature-branch
git push origin main
```

### Method 2: Manual Deployment
Trigger deployment manually from GitHub Actions:

1. Go to repository → **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow** button
4. Select `main` branch
5. Optionally add deployment reason
6. Click **Run workflow**

## Deployment Steps

When deployment is triggered (automatically or manually):

1. ✅ GitHub Actions checks out code
2. ✅ Sets up Node.js 18 environment
3. ✅ Installs dependencies with `npm ci`
4. ✅ Builds Next.js application with `npm run build`
5. ✅ Deploys `out/` directory to Cloudflare Pages
6. ✅ Updates deployment on `ross-tax-prep.pages.dev`

## Post-Deployment Verification

After deployment completes:

### 1. Check Deployment Status
- ✅ GitHub Actions workflow shows green checkmark
- ✅ No errors in build logs
- ✅ Deployment summary shows success

### 2. Verify Site Accessibility
- [ ] Visit `https://ross-tax-prep.pages.dev`
- [ ] Homepage loads successfully
- [ ] No console errors in browser
- [ ] Assets (CSS, JS) load properly

### 3. Test Critical Paths
- [ ] Navigation works across pages
- [ ] Bank products flow accessible
- [ ] Dashboard loads
- [ ] Login page accessible
- [ ] No 404 errors on key routes

### 4. Monitor Cloudflare Dashboard
- [ ] Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
- [ ] Navigate to Pages → ross-tax-prep
- [ ] Verify deployment shows as active
- [ ] Check deployment logs for any errors

## Custom Domain Setup (Optional)

To use a custom domain:

1. Go to Cloudflare Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter domain (e.g., `rosstaxprep.com`)
5. Follow DNS configuration instructions
6. SSL certificate auto-provisioned by Cloudflare

## Rollback Procedure

If issues are found after deployment:

### Via Cloudflare Dashboard:
1. Go to Cloudflare Dashboard → Pages → ross-tax-prep
2. Click **Deployments** tab
3. Find previous working deployment
4. Click three dots (⋯) → **Rollback to this deployment**

### Via GitHub:
1. Identify problematic commit
2. Revert commit: `git revert <commit-sha>`
3. Push to main: `git push origin main`
4. New deployment automatically triggered

## Security Considerations

- ✅ All secrets managed via GitHub Secrets and Cloudflare
- ✅ No sensitive data committed to repository
- ✅ `.gitignore` configured to exclude secrets and build artifacts
- ✅ HTTPS enforced by Cloudflare Pages
- ✅ Environment variables set for production

## Monitoring & Maintenance

### Health Check
```bash
curl https://ross-tax-prep.pages.dev/api/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### Regular Tasks
- [ ] Monitor error rates in Cloudflare Analytics
- [ ] Review deployment logs weekly
- [ ] Rotate secrets every 90 days
- [ ] Backup D1 database regularly
- [ ] Keep dependencies updated

## Support Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Repository Documentation:**
  - [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
  - [SETUP.md](./SETUP.md) - Infrastructure setup
  - [QUICKSTART-DEPLOYMENT.md](./QUICKSTART-DEPLOYMENT.md) - Quick reference
  - [README.md](./README.md) - Application overview

## Production Ready Status

✅ **Build Configuration:** Ready
✅ **Deployment Workflows:** Configured
✅ **Production Settings:** Updated
⚠️ **GitHub Secrets:** Need to verify
⚠️ **Cloudflare Resources:** Need to create post-deployment
⚠️ **Production Secrets:** Need to set post-deployment

## Next Steps

1. **Verify GitHub Secrets are configured** (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
2. **Trigger production deployment** using one of the methods above
3. **Monitor deployment** in GitHub Actions and Cloudflare Dashboard
4. **Verify site is live** at https://ross-tax-prep.pages.dev
5. **Complete post-deployment setup** (D1, KV, R2, secrets) following the checklists above
6. **Test all critical functionality** to ensure everything works as expected

---

**Status:** Ready for deployment pending GitHub secrets verification ✅

Last Updated: 2026-02-05
