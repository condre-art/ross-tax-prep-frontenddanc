# Ross Tax Prep - Complete Setup Guide

## Overview

This system integrates:
- **Cloudflare R2** for document storage
- **Cloudflare D1** for SQL database
- **Cloudflare Workers** for serverless API
- **Cloudflare KV** for session management
- **IRS MEF** integration for e-file transmission
- **JWT** authentication with 2FA support
- **Role-based access control** (Admin, ERO, Client, Demo)
- **End-to-end encryption** for sensitive data

## Prerequisites

1. **Cloudflare Account** with Workers and Pages access
2. **Node.js** 18+ installed
3. **Wrangler CLI** installed globally:
   ```bash
   npm install -g wrangler
   ```
4. **IRS e-Services Account** with EFIN and ETIN (for production)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
# Create the production database
wrangler d1 create ross-tax-prep-db

# Copy the database_id from output and update wrangler.toml
# Update line: database_id = "your-database-id-here"
```

### 4. Run Database Migrations

```bash
# Apply initial schema
wrangler d1 execute ross-tax-prep-db --file=./database/migrations/001_initial_schema.sql

# For local development
wrangler d1 execute ross-tax-prep-db --local --file=./database/migrations/001_initial_schema.sql
```

### 5. Create KV Namespaces

```bash
# Create SESSIONS namespace
wrangler kv:namespace create "SESSIONS"
# Copy the id and update wrangler.toml [[kv_namespaces]] id

# Create SESSIONS preview
wrangler kv:namespace create "SESSIONS" --preview
# Copy the preview_id and update wrangler.toml

# Create CACHE namespace
wrangler kv:namespace create "CACHE"
# Update wrangler.toml

# Create CACHE preview
wrangler kv:namespace create "CACHE" --preview
# Update wrangler.toml
```

### 6. Create R2 Buckets

```bash
# Production buckets
wrangler r2 bucket create ross-tax-documents
wrangler r2 bucket create ross-client-uploads
wrangler r2 bucket create ross-irs-submissions

# Preview buckets (for development)
wrangler r2 bucket create ross-tax-documents-preview
wrangler r2 bucket create ross-client-uploads-preview
wrangler r2 bucket create ross-irs-submissions-preview
```

### 7. Generate and Set Secrets

```bash
# Generate a strong JWT secret (32+ characters)
wrangler secret put JWT_SECRET
# Enter a random string like: your-super-secret-jwt-key-change-this-in-production

# Generate encryption key (use a secure random generator)
wrangler secret put ENCRYPTION_KEY
# Enter a base64-encoded 256-bit key

# Database encryption key
wrangler secret put DB_ENCRYPTION_KEY
# Enter another strong random key

# TOTP secret for 2FA
wrangler secret put TOTP_SECRET
# Enter a strong random string

# IRS credentials (obtain from IRS e-Services)
wrangler secret put IRS_EFIN
# Enter your Electronic Filing Identification Number

wrangler secret put IRS_ETIN
# Enter your Electronic Transmitter Identification Number

wrangler secret put IRS_CERTIFICATE
# Enter base64-encoded IRS authentication certificate

wrangler secret put IRS_PRIVATE_KEY
# Enter base64-encoded private key for IRS authentication
```

### 8. Generate Encryption Key Helper

You can generate a secure encryption key using Node.js:

```javascript
// generate-key.js
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('base64');
console.log('Encryption Key:', key);
```

Run: `node generate-key.js`

## Development

### Local Development

```bash
# Start local development server with wrangler
npm run pages:dev

# Or use Next.js dev server (for frontend only)
npm run dev
```

The local server will run at http://localhost:8788 (wrangler) or http://localhost:3000 (Next.js).

### Testing API Endpoints

```bash
# Register a new user
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

# Get current user (requires token)
curl http://localhost:8788/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Production Deployment

### Build and Deploy

```bash
# Build Next.js site
npm run build

# Deploy to Cloudflare Pages
npm run pages:deploy

# Or use wrangler directly
wrangler pages deploy ./out --project-name=ross-tax-prep
```

### Configure Production Settings

1. Update `wrangler.toml` with production values:
   ```toml
   [vars]
   ENVIRONMENT = "production"
   IRS_MEF_ENDPOINT = "https://prod.irs.gov/mef"
   IRS_TEST_MODE = "false"
   ```

2. Set all production secrets using `wrangler secret put`

3. Update database with production data:
   ```bash
   wrangler d1 execute ross-tax-prep-db --command="UPDATE users SET status='active' WHERE email='admin@rosstax.com'"
   ```

## Security Configuration

### 1. Password Hashing

Update the default admin password in the database:

```bash
# Generate password hash using Node.js
node -e "
const crypto = require('crypto');
const password = 'YourStrongPassword123!';
// Use proper bcrypt in production
console.log('Password:', password);
"

# Then update in database
wrangler d1 execute ross-tax-prep-db --command="UPDATE users SET password_hash='$pbkdf2$...' WHERE email='admin@rosstax.com'"
```

### 2. Enable 2FA for Admin Accounts

1. Login as admin
2. Call POST `/api/auth/mfa/setup` with admin token
3. Scan QR code with authenticator app
4. Call POST `/api/auth/mfa/verify` with code to enable

### 3. Configure CORS (if needed)

Update `functions/_middleware.ts` to restrict allowed origins:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  // ... other headers
};
```

## User Roles and Permissions

### Admin Role
- Full system access
- User management
- System configuration
- All API endpoints

### ERO (Electronic Return Originator) Role
- Create and manage returns
- Submit to IRS
- Client management
- Document access

### Client Role
- View own returns
- Upload documents
- View status
- Limited read access

### Demo Role
- Read-only access
- No modification rights
- Limited data visibility

## IRS MEF Integration

### Test Mode Configuration

For testing (default in development):

```toml
[vars]
IRS_MEF_ENDPOINT = "https://testbed.irs.gov/mef"
IRS_TEST_MODE = "true"
```

### Production Mode

For live IRS submissions:

```toml
[vars]
IRS_MEF_ENDPOINT = "https://prod.irs.gov/mef"
IRS_TEST_MODE = "false"
```

Ensure you have:
- Valid IRS EFIN (Electronic Filing Identification Number)
- Valid IRS ETIN (Electronic Transmitter Identification Number)
- IRS-issued authentication certificate
- Completed IRS Suitability Check
- Passed IRS Assurance Testing System (ATS)

### Transmission Workflow

1. Client uploads documents → Stored in R2
2. ERO prepares return → Encrypted in D1
3. ERO submits return → `POST /api/irs/transmit`
4. System generates MEF XML → Validates against IRS schema
5. XML transmitted to IRS → Certificate authentication
6. IRS acknowledgment received → Status updated in D1
7. Client notified of acceptance/rejection

## Monitoring and Maintenance

### Database Maintenance

```bash
# View audit logs
wrangler d1 execute ross-tax-prep-db --command="SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100"

# Check active sessions
wrangler d1 execute ross-tax-prep-db --command="SELECT COUNT(*) as active_sessions FROM sessions WHERE expires_at > datetime('now')"

# Export database backup
wrangler d1 export ross-tax-prep-db --output=backup-$(date +%Y%m%d).sql
```

### R2 Storage Management

```bash
# List objects in bucket
wrangler r2 object list ross-tax-documents --limit 100

# Get storage usage
wrangler r2 bucket list
```

### Session Cleanup

Add a scheduled worker to clean up expired sessions:

```bash
# In wrangler.toml, add:
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

## Troubleshooting

### Database Connection Issues

```bash
# Check database exists
wrangler d1 list

# Test database connection
wrangler d1 execute ross-tax-prep-db --command="SELECT 1"
```

### API Authentication Issues

1. Check JWT secret is set: `wrangler secret list`
2. Verify token format in Authorization header
3. Check token expiration (default 24 hours)
4. Review audit logs for failed attempts

### R2 Upload Issues

1. Verify bucket exists: `wrangler r2 bucket list`
2. Check file size limits (50MB default)
3. Verify content type is allowed
4. Check R2 binding in wrangler.toml

## Support and Documentation

- **IRS MEF Documentation**: https://www.irs.gov/e-file-providers/modernized-e-file-mef-for-software-developers
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Cloudflare D1 Docs**: https://developers.cloudflare.com/d1/
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate secrets** regularly (every 90 days)
3. **Enable 2FA** for all admin accounts
4. **Monitor audit logs** for suspicious activity
5. **Backup database** regularly
6. **Use HTTPS only** in production
7. **Implement rate limiting** for API endpoints
8. **Encrypt all PII** (SSN, account numbers, etc.)
9. **Follow IRS security guidelines** for e-file systems
10. **Regular security audits** and penetration testing

## Compliance Requirements

- **IRS Publication 1345**: Handbook for Authorized IRS e-file Providers
- **IRS Publication 4164**: Modernized e-File Guide
- **GLBA**: Financial data protection
- **State tax regulations**: Varies by state
- **Data retention**: 7 years for tax records
- **Security controls**: IRS-required safeguards
