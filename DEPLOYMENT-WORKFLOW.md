# Deployment Guide for Workflow System

## Overview
This guide covers the deployment of the new workflow management and e-filing system for Ross Tax Prep.

## Pre-Deployment Checklist

### 1. Database Migration
Apply the new migration to add workflow tables:

```bash
# Using Wrangler CLI
wrangler d1 execute <DATABASE_NAME> --remote --file=database/migrations/002_workflow_system.sql

# Or via Cloudflare dashboard D1 console
# Copy and paste the contents of 002_workflow_system.sql
```

**Important**: Ensure migration `001_initial_schema.sql` has been applied first.

### 2. Environment Variables
No new environment variables are required. The system uses existing:
- `IRS_EFIN` - Already configured
- `IRS_ETIN` - Already configured
- `IRS_MEF_ENDPOINT` - Already configured
- `IRS_TEST_MODE` - Already configured
- `JWT_SECRET` - Already configured
- `ENCRYPTION_KEY` - Already configured

### 3. Provider Configuration (Optional)
If using TaxSlayer or additional providers, configure their credentials:

```sql
-- Update TaxSlayer provider with API credentials
UPDATE efile_providers 
SET 
  api_key_encrypted = '<encrypted_api_key>',
  credentials_encrypted = '<encrypted_credentials_json>'
WHERE id = 'provider_taxslayer';
```

### 4. Test Mode Verification
Initially deploy with test mode enabled:
```sql
-- Verify test mode is enabled
SELECT id, name, test_mode FROM efile_providers;

-- Should show test_mode = 1 for both providers
```

## Deployment Steps

### 1. Build Application
```bash
npm run build
```

### 2. Deploy to Cloudflare Pages
```bash
# Automated deployment (via GitHub Actions)
git push origin main

# Or manual deployment
npm run pages:deploy
```

### 3. Verify Deployment
After deployment, test the following:

#### A. Workflow API Endpoints
```bash
# Login to get token
curl -X POST https://your-domain.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'

# Create a workflow (replace TOKEN)
curl -X POST https://your-domain.pages.dev/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "template_id": "template_return_filing",
    "name": "Test Workflow"
  }'

# List workflows
curl https://your-domain.pages.dev/api/workflows \
  -H "Authorization: Bearer TOKEN"
```

#### B. E-File Provider Endpoints
```bash
# List providers
curl https://your-domain.pages.dev/api/efile/providers \
  -H "Authorization: Bearer TOKEN"
```

#### C. UI Access
- Navigate to: `https://your-domain.pages.dev/app/workflows`
- Navigate to: `https://your-domain.pages.dev/app/efile`
- Verify dashboard shows new navigation links

## Post-Deployment Configuration

### 1. Production Mode (When Ready)
Switch providers to production mode:

```sql
-- Switch to production mode (ONLY WHEN READY)
UPDATE efile_providers 
SET test_mode = 0 
WHERE id = 'provider_irs_mef';
```

### 2. Create Additional Workflow Templates
Add custom workflow templates as needed:

```sql
INSERT INTO workflow_templates (
  id, name, description, type, steps, created_by
) VALUES (
  'template_custom',
  'Custom Workflow',
  'Description here',
  'custom',
  '[{"id":"step1","name":"Step 1","description":"...","order":1,"required":true}]',
  'admin_user_id'
);
```

### 3. Configure Provider Credentials

#### For IRS MEF (Production)
1. Obtain IRS Electronic Filing Identification Number (EFIN)
2. Obtain IRS Electronic Transmitter Identification Number (ETIN)
3. Obtain and configure IRS certificate
4. Update environment variables in Cloudflare Pages dashboard

#### For TaxSlayer Pro
1. Sign up for TaxSlayer Pro API access
2. Obtain API key and credentials
3. Encrypt credentials using application encryption key
4. Update provider configuration in database

### 4. User Training
Train ERO and Admin users on:
1. Creating workflows from templates
2. Managing and completing tasks
3. E-filing to different providers
4. Monitoring workflow progress
5. Handling e-file acknowledgments

## Monitoring

### 1. Check Audit Logs
Monitor workflow and e-file operations:

```sql
SELECT * FROM audit_logs 
WHERE action LIKE '%workflow%' OR action LIKE '%efile%'
ORDER BY created_at DESC 
LIMIT 100;
```

### 2. Monitor Workflow Status
Check for stuck workflows:

```sql
SELECT id, name, status, current_step, due_date
FROM workflow_instances
WHERE status = 'in_progress' 
  AND created_at < datetime('now', '-7 days');
```

### 3. Monitor E-File Submissions
Check submission statuses:

```sql
SELECT 
  provider_id,
  status,
  COUNT(*) as count
FROM efile_submissions
GROUP BY provider_id, status;
```

### 4. Check Failed Submissions
Review any failed e-file submissions:

```sql
SELECT * FROM efile_submissions
WHERE status IN ('error', 'rejected')
ORDER BY created_at DESC;
```

## Rollback Procedure

If issues occur, rollback steps:

### 1. Revert Code
```bash
git revert <commit-hash>
git push origin main
```

### 2. Remove Migration (If Necessary)
**Warning**: Only if no production data exists

```sql
-- Drop workflow tables (ONLY IF SAFE)
DROP TABLE IF EXISTS workflow_transitions;
DROP TABLE IF EXISTS workflow_tasks;
DROP TABLE IF EXISTS workflow_instances;
DROP TABLE IF EXISTS workflow_templates;
DROP TABLE IF EXISTS efile_submissions;
DROP TABLE IF EXISTS efile_providers;

-- Remove workflow permissions from roles
UPDATE roles SET permissions = json_remove(
  permissions,
  -- Remove workflow permission paths
) WHERE id IN (SELECT id FROM roles);
```

### 3. Restore Previous Build
Use Cloudflare Pages rollback feature in dashboard

## Troubleshooting

### Issue: Workflows Not Creating
**Solution**: 
- Check database connection
- Verify migration was applied
- Check user has `workflows.create` permission
- Review audit logs for errors

### Issue: E-File Submission Fails
**Solution**:
- Verify provider is active and configured
- Check test_mode setting matches environment
- Verify return has required data
- Review submission_response field for error details

### Issue: Tasks Not Completing
**Solution**:
- Verify user is assigned to task
- Check required_role matches user's role
- Verify task dependencies are completed
- Check for database errors in logs

### Issue: UI Pages Not Loading
**Solution**:
- Verify build was successful
- Check browser console for errors
- Verify authentication token is valid
- Clear browser cache

## Security Notes

1. **Credentials**: All provider credentials must be encrypted before storage
2. **Permissions**: Verify role permissions are correctly configured
3. **Audit Logs**: Regularly review audit logs for suspicious activity
4. **Test Mode**: Always test in test mode before production submissions
5. **Access Control**: Limit access to provider configuration to admins only

## Support Resources

- **Documentation**: See `WORKFLOW.md` for detailed system documentation
- **API Reference**: See `WORKFLOW.md` API section for endpoint details
- **Database Schema**: See `database/migrations/002_workflow_system.sql`
- **IRS MEF Info**: https://www.irs.gov/e-file-providers
- **Cloudflare Docs**: https://developers.cloudflare.com/pages

## Success Criteria

Deployment is successful when:
- [ ] Database migration applied without errors
- [ ] All API endpoints responding correctly
- [ ] UI pages load and function properly
- [ ] Test workflow can be created and completed
- [ ] Test e-file submission works (in test mode)
- [ ] Audit logs show all operations
- [ ] No security vulnerabilities found
- [ ] Build completes without errors
- [ ] Navigation links work correctly

## Maintenance Schedule

Recommended maintenance tasks:
- **Daily**: Review failed e-file submissions
- **Weekly**: Check stuck workflows, review audit logs
- **Monthly**: Review provider performance, update documentation
- **Quarterly**: Security audit, permission review
- **Annually**: Update IRS MEF schema version, provider certifications

## Contact

For issues or questions during deployment:
1. Check troubleshooting section above
2. Review audit logs for error details
3. Contact system administrator
4. Refer to WORKFLOW.md documentation
