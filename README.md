# Ross Tax Prep — Frontend

**IRS e-file approved ERO tax software** with integrated backend, secure authentication, encrypted data storage, and IRS MEF integration.

## Features

- ✅ **Cloudflare R2** Object Storage for documents
- ✅ **Cloudflare D1** SQL database with complete schema
- ✅ **JWT Authentication** with 2FA (TOTP) support
- ✅ **Role-Based Access Control** (Admin, ERO, Client, Demo)
- ✅ **End-to-End Encryption** for sensitive data (SSN, tax returns)
- ✅ **IRS MEF Integration** for e-file transmission
- ✅ **Comprehensive Audit Logging** for compliance
- ✅ **Session Management** with KV storage
- ✅ Client-facing flows for bank products and refund allocation

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start Next.js dev server (frontend only)
npm run dev

# Start Cloudflare Pages dev server (with API)
npm run pages:dev
```

### Full Setup

For complete setup including database, R2 buckets, and IRS integration, see **[SETUP.md](./SETUP.md)** for detailed instructions.

Quick setup overview:
1. Install Wrangler CLI: `npm install -g wrangler`
2. Login to Cloudflare: `wrangler login`
3. Create D1 database and run migrations
4. Create KV namespaces and R2 buckets
5. Set secrets (JWT, encryption keys, IRS credentials)
6. Update `wrangler.toml` with resource IDs

See [.env.example](./.env.example) for required environment variables.

## Routes

### Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Entry page linking to flows |
| `/app/bank-products` | Provider/product selection, payout method, disclosures |
| `/app/bank-products/advance` | Refund advance decision screen |
| `/app/refund-allocation` | Savings bonds + split deposits |
| `/portal/login.html` | Client portal login |
| `/admin-console.html` | Admin console |

### API Endpoints

| Endpoint | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/api/auth/register` | POST | Public | Register new user |
| `/api/auth/login` | POST | Public | User login (with 2FA support) |
| `/api/auth/logout` | POST | Required | User logout |
| `/api/auth/mfa/setup` | POST | Required | Setup 2FA/TOTP |
| `/api/auth/mfa/verify` | POST | Required | Verify and enable 2FA |
| `/api/auth/mfa/disable` | POST | Required | Disable 2FA |
| `/api/users/me` | GET | Required | Get current user info |
| `/api/documents/upload` | POST | Required | Upload document to R2 |
| `/api/documents` | GET | Required | List user documents |
| `/api/irs/transmit` | POST | ERO/Admin | Submit return to IRS |
| `/api/irs/status` | GET | ERO/Admin | Check IRS submission status |
| `/api/health` | GET | Public | Health check |

## User Roles & Permissions

| Role | Permissions |
| --- | --- |
| **Admin** | Full system access - all operations |
| **ERO** | Create/submit returns, manage clients, upload documents, IRS transmission |
| **Client** | View own returns, upload documents, view notifications |
| **Demo** | Read-only access to limited data |

## Security Features

- **Password Hashing**: PBKDF2 with 100,000 iterations
- **2FA Support**: TOTP-based (compatible with Google Authenticator, Authy, etc.)
- **Data Encryption**: AES-256-GCM for sensitive fields (SSN, bank accounts, return data)
- **Session Management**: JWT tokens with configurable expiration
- **Audit Logging**: All actions logged with user, IP, timestamp
- **Role-Based Access Control**: Fine-grained permissions per role

## Database Schema

Complete D1 schema includes:
- `users` - User accounts with encrypted PII
- `roles` - Role definitions and permissions
- `sessions` - Active user sessions
- `tax_returns` - Tax return data with encryption
- `documents` - Document metadata with R2 references
- `irs_transmissions` - IRS e-file transmission logs
- `audit_logs` - Comprehensive audit trail
- `notifications` - User notifications
- `compliance_records` - Disclosure acceptance tracking
- `refund_allocations` - Refund distribution preferences
- `bank_products` - Bank product selections

See [database/migrations/001_initial_schema.sql](./database/migrations/001_initial_schema.sql) for complete schema.

## IRS MEF Integration

- MEF Schema Version: **2024v5.0**
- Test Mode: Testbed endpoint for development
- Production Mode: Live IRS submission with certificate authentication
- Transmission tracking and acknowledgment processing
- Full compliance with IRS Publication 1345 and 4164

## Deployment

The application is deployed to Cloudflare Pages using GitHub Actions for continuous deployment.

### Automatic Deployment

Push to `main` branch triggers automatic production deployment:

```bash
git push origin main
```

### Manual Deployment

Trigger deployment via GitHub Actions:
1. Go to **Actions** tab in your repository
2. Select **Deploy to Production** workflow
3. Click **Run workflow**

### Preview Deployments

Pull requests automatically create preview deployments with unique URLs.

### Complete Deployment Guide

For detailed deployment instructions, including:
- Setting up GitHub Actions secrets
- Configuring Cloudflare Pages
- Managing environment variables
- Post-deployment configuration
- Rollback procedures
- Troubleshooting

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete guide.

### Production Checklist

- [ ] Configure GitHub secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- [ ] Update `wrangler.toml` with production database/KV/R2 IDs
- [ ] Set all production secrets via Cloudflare Pages dashboard
- [ ] Change `IRS_TEST_MODE` to `false` for live submissions
- [ ] Update IRS MEF endpoint to production URL
- [ ] Update default admin password
- [ ] Enable 2FA for all admin accounts
- [ ] Configure CORS for your domain
- [ ] Set up database backups
- [ ] Enable monitoring and alerts
- [ ] Configure custom domain (optional)

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete infrastructure setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - GitHub Actions deployment guide
- **[database/README.md](./database/README.md)** - Database setup instructions
- **[.env.example](./.env.example)** - Environment variables reference

## Support

- **IRS MEF Documentation**: https://www.irs.gov/e-file-providers
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Cloudflare D1**: https://developers.cloudflare.com/d1/
- **Cloudflare R2**: https://developers.cloudflare.com/r2/
