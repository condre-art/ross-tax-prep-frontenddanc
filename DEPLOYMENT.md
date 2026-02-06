# Deployment Guide

This guide explains how to deploy the Ross Tax Prep application to production using GitHub Actions and Cloudflare Pages.

## Overview

The application is deployed to Cloudflare Pages using GitHub Actions workflows. There are two workflows:

1. **Production Deployment** - Deploys to production when changes are pushed to `main`
2. **Preview Deployment** - Creates preview environments for pull requests

## Prerequisites

Before deploying, ensure you have:

1. A Cloudflare account with Pages enabled
2. A Cloudflare Pages project (will be created automatically if it doesn't exist)
3. GitHub repository with Actions enabled
4. Required secrets configured in GitHub

## Quick Start

### 1. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

#### Required Secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | API token with Pages permissions | See [Creating API Token](#creating-cloudflare-api-token) below |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | See [Finding Account ID](#finding-cloudflare-account-id) below |

### 2. Deploy to Production

Once secrets are configured, deployment happens automatically:

#### Automatic Deployment:
```bash
# Push to main branch triggers automatic deployment
git checkout main
git merge your-feature-branch
git push origin main
```

#### Manual Deployment:
1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Choose the branch (typically `main`)
5. Optionally add a deployment reason
6. Click **Run workflow**

### 3. Preview Deployments

Preview deployments are automatically created for all pull requests:

1. Create a pull request targeting `main`
2. GitHub Actions will automatically build and deploy a preview
3. A comment will be added to the PR with the preview URL
4. Each commit to the PR triggers a new preview deployment

## Detailed Setup Instructions

### Creating Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template OR create a custom token with:
   - **Permissions**: 
     - Account > Cloudflare Pages > Edit
   - **Account Resources**:
     - Include > Your Account
4. Click **Continue to summary**
5. Click **Create Token**
6. **Copy the token** (shown only once - store it securely!)

### Finding Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on **Pages** in the left sidebar
3. Your Account ID is visible in:
   - The URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/pages`
   - Or go to **Workers & Pages** → **Overview** and find it in the right sidebar

### Creating Cloudflare Pages Project (Optional)

The first deployment will create the project automatically, but you can create it manually:

```bash
# Install wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create ross-tax-prep
```

## Deployment Workflows

### Production Workflow (`deploy-production.yml`)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Process:**
1. Checks out code
2. Sets up Node.js 18
3. Installs dependencies with `npm ci`
4. Builds the Next.js application with `npm run build`
5. Deploys the `out/` directory to Cloudflare Pages
6. Creates deployment summary

**Environment:** Production

### Preview Workflow (`deploy-preview.yml`)

**Triggers:**
- Pull requests to `main` branch
- Manual workflow dispatch

**Process:**
1. Same build steps as production
2. Deploys to a unique preview URL
3. Comments on the PR with the preview URL
4. Creates deployment summary

**Environment:** Preview (isolated from production)

## Monitoring Deployments

### Via GitHub Actions

1. Go to **Actions** tab in your repository
2. Click on a workflow run to see details
3. View logs for each step
4. Check the deployment summary at the bottom

### Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Pages** in the left sidebar
3. Select **ross-tax-prep** project
4. View deployment history, logs, and analytics

## Post-Deployment Configuration

After your first deployment, configure the production environment:

### 1. Set Cloudflare Environment Variables

Go to your Cloudflare Pages project settings and add:

```bash
ENVIRONMENT=production
IRS_MEF_ENDPOINT=https://prod.irs.gov/mef
IRS_TEST_MODE=false
```

### 2. Configure Bindings

Ensure these bindings are configured in your Cloudflare Pages project:

- **D1 Database**: `DB` → `ross-tax-prep-db`
- **KV Namespaces**: 
  - `SESSIONS` → (your KV namespace ID)
  - `CACHE` → (your KV namespace ID)
- **R2 Buckets**:
  - `TAX_DOCUMENTS` → `ross-tax-documents`
  - `CLIENT_UPLOADS` → `ross-client-uploads`
  - `IRS_SUBMISSIONS` → `ross-irs-submissions`

### 3. Set Production Secrets

Use Wrangler CLI to set secrets:

```bash
# Set secrets for production
wrangler pages secret put JWT_SECRET --project-name=ross-tax-prep
wrangler pages secret put ENCRYPTION_KEY --project-name=ross-tax-prep
wrangler pages secret put DB_ENCRYPTION_KEY --project-name=ross-tax-prep
wrangler pages secret put TOTP_SECRET --project-name=ross-tax-prep
wrangler pages secret put IRS_EFIN --project-name=ross-tax-prep
wrangler pages secret put IRS_ETIN --project-name=ross-tax-prep
wrangler pages secret put IRS_CERTIFICATE --project-name=ross-tax-prep
wrangler pages secret put IRS_PRIVATE_KEY --project-name=ross-tax-prep
```

## Custom Domains

To use a custom domain:

1. Go to your Cloudflare Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `rosstaxprep.com`)
5. Follow the DNS configuration instructions
6. SSL certificate will be automatically provisioned

## Rollback

If you need to rollback a deployment:

1. Go to Cloudflare Dashboard → Pages → ross-tax-prep
2. Click on **Deployments** tab
3. Find the previous working deployment
4. Click the three dots (⋯) next to it
5. Select **Rollback to this deployment**

Or via GitHub:

1. Revert the problematic commit
2. Push to `main` to trigger a new deployment

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to Actions tab
2. Click on the failed workflow run
3. Expand the "Build Next.js site" step

**Common issues:**
- Missing dependencies: Run `npm install` locally to verify
- TypeScript errors: Run `npm run build` locally
- Environment variable issues: Check your secrets configuration

### Deployment Fails

**Authentication Error:**
- Verify `CLOUDFLARE_API_TOKEN` has correct permissions
- Check the token hasn't expired
- Ensure `CLOUDFLARE_ACCOUNT_ID` is correct

**Project Not Found:**
- The project will be created automatically on first deployment
- Or create it manually: `wrangler pages project create ross-tax-prep`

### Production Site Not Working

**Check Cloudflare Pages settings:**
1. Verify all environment variables are set
2. Check bindings (D1, KV, R2) are configured
3. Review function logs in Cloudflare dashboard
4. Ensure secrets are set for the production environment

## Performance Monitoring

### Cloudflare Analytics

View analytics in Cloudflare Dashboard:
- Request volume
- Bandwidth usage
- Response times
- Error rates
- Geographic distribution

### Health Checks

Monitor your deployment health:

```bash
# Check health endpoint
curl https://ross-tax-prep.pages.dev/api/health

# Expected response:
# {"status":"healthy","timestamp":"2026-02-04T21:45:00.000Z"}
```

## Best Practices

1. **Always test locally before pushing:**
   ```bash
   npm run build
   npm run pages:dev
   ```

2. **Use pull requests for all changes:**
   - Creates preview deployment automatically
   - Allows review before merging to production

3. **Monitor deployments:**
   - Check GitHub Actions logs
   - Review Cloudflare Pages dashboard
   - Set up error monitoring

4. **Keep secrets secure:**
   - Never commit secrets to git
   - Rotate secrets regularly
   - Use strong, unique values

5. **Regular backups:**
   - Export D1 database regularly
   - Backup R2 objects
   - Document configuration

## Support

For deployment issues:
- GitHub Actions documentation: https://docs.github.com/en/actions
- Cloudflare Pages documentation: https://developers.cloudflare.com/pages/
- Cloudflare Pages GitHub Action: https://github.com/cloudflare/pages-action

For application issues:
- See [SETUP.md](./SETUP.md) for infrastructure setup
- See [README.md](./README.md) for application documentation
