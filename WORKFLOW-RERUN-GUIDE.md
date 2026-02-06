# How to Rerun Failed Workflows

## Quick Steps to Rerun a Failed Workflow

If a GitHub Actions workflow fails, you can easily rerun it:

### Method 1: Rerun from Failed Run (Recommended)

1. Go to the **Actions** tab in your GitHub repository
2. Find the failed workflow run in the list
3. Click on the failed run to open it
4. Click the **"Re-run jobs"** button in the top right
5. Choose either:
   - **Re-run failed jobs** - Only reruns the jobs that failed
   - **Re-run all jobs** - Reruns the entire workflow

### Method 2: Trigger Manually

1. Go to the **Actions** tab in your GitHub repository
2. Select the workflow you want to run from the left sidebar:
   - **Deploy to Production** - For production deployments
   - **Deploy Preview** - For preview deployments
3. Click **"Run workflow"** button (top right)
4. Select the branch (usually `main`)
5. (Optional) Add a reason for the deployment
6. Click **"Run workflow"**

## Common Failure Scenarios and Solutions

### 1. Authentication/Secrets Error

**Error Message:** `Authentication failed` or `Invalid credentials`

**Solution:**
- Verify that the following secrets are correctly set in GitHub repository settings:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Check that the API token has the correct permissions (Cloudflare Pages:Edit)
- Ensure the token hasn't expired

**How to Fix:**
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Update or recreate the secrets as needed
3. Rerun the workflow

### 2. Build Failure

**Error Message:** Build errors, TypeScript errors, or dependency issues

**Solution:**
1. Review the build logs in the failed workflow run
2. Test the build locally:
   ```bash
   npm ci
   npm run build
   ```
3. Fix any errors in the code
4. Commit and push the fixes
5. The workflow will automatically run again

### 3. Cloudflare Pages Error

**Error Message:** `Project not found` or deployment errors

**Solution:**
- Ensure the Cloudflare Pages project `ross-tax-prep` exists
- Verify the account ID matches your Cloudflare account
- Check Cloudflare status page for service issues

### 4. Transient/Network Errors

**Error Message:** Timeout, network errors, or temporary service issues

**Solution:**
- Simply rerun the workflow (Method 1 above)
- These errors are usually temporary and resolve on retry

## Monitoring Workflows

### View Workflow Status

1. Go to **Actions** tab
2. See all workflow runs with their status:
   - ✅ Green checkmark = Success
   - ❌ Red X = Failed
   - 🟡 Yellow circle = Running
   - ⚪ Gray circle = Queued

### View Logs

1. Click on any workflow run
2. Click on a job name to see detailed logs
3. Expand steps to see detailed output
4. Download logs if needed using the download button

## Workflow Configurations

### Deploy to Production
- **Triggers:** Push to `main` branch, or manual workflow dispatch
- **Purpose:** Deploy to production environment
- **Branch:** `main`

### Deploy Preview
- **Triggers:** Pull request to `main` branch, or manual workflow dispatch
- **Purpose:** Create preview deployment for testing
- **Branch:** Any PR branch

## Need Help?

If workflows continue to fail after retrying:

1. Check the workflow logs for specific error messages
2. Review the [Troubleshooting section in .github/workflows/README.md](.github/workflows/README.md)
3. Verify all secrets are correctly configured
4. Test the build locally to rule out code issues
5. Check Cloudflare and GitHub status pages for service issues

## Manual Deployment (Alternative)

If GitHub Actions is unavailable, you can deploy manually using Wrangler:

```bash
# Install dependencies
npm ci

# Build the site
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name=ross-tax-prep
```

Note: This requires Wrangler to be authenticated with your Cloudflare account.
