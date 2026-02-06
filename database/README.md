# Database Setup

## Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

## Create D1 Database

```bash
# Create the production database
wrangler d1 create ross-tax-prep-db

# The command will output a database ID. Copy this ID and update it in wrangler.toml
# under [[d1_databases]] -> database_id
```

## Run Migrations

```bash
# Apply the initial schema migration
wrangler d1 execute ross-tax-prep-db --file=./database/migrations/001_initial_schema.sql

# For local development, use --local flag
wrangler d1 execute ross-tax-prep-db --local --file=./database/migrations/001_initial_schema.sql
```

## Create KV Namespaces

```bash
# Create SESSIONS namespace
wrangler kv:namespace create "SESSIONS"
# Copy the ID and update wrangler.toml [[kv_namespaces]] -> id

# Create SESSIONS preview namespace
wrangler kv:namespace create "SESSIONS" --preview
# Copy the preview_id and update wrangler.toml

# Create CACHE namespace
wrangler kv:namespace create "CACHE"
# Copy the ID and update wrangler.toml

# Create CACHE preview namespace
wrangler kv:namespace create "CACHE" --preview
# Copy the preview_id and update wrangler.toml
```

## Create R2 Buckets

```bash
# Create production buckets
wrangler r2 bucket create ross-tax-documents
wrangler r2 bucket create ross-client-uploads
wrangler r2 bucket create ross-irs-submissions

# Create preview buckets for development
wrangler r2 bucket create ross-tax-documents-preview
wrangler r2 bucket create ross-client-uploads-preview
wrangler r2 bucket create ross-irs-submissions-preview
```

## Set Secrets

```bash
# JWT secret for token signing
wrangler secret put JWT_SECRET

# Encryption key for sensitive data (generate a strong 32-byte key)
wrangler secret put ENCRYPTION_KEY

# Database encryption key
wrangler secret put DB_ENCRYPTION_KEY

# TOTP secret for 2FA
wrangler secret put TOTP_SECRET

# IRS credentials (obtain from IRS e-Services)
wrangler secret put IRS_EFIN
wrangler secret put IRS_ETIN
wrangler secret put IRS_CERTIFICATE
wrangler secret put IRS_PRIVATE_KEY
```

## Query Database (for testing)

```bash
# Query users table
wrangler d1 execute ross-tax-prep-db --command="SELECT * FROM users LIMIT 10"

# Query with local database
wrangler d1 execute ross-tax-prep-db --local --command="SELECT * FROM users"

# Export database
wrangler d1 export ross-tax-prep-db --output=backup.sql
```

## Database Schema

### Tables

- **users**: User accounts (admin, client, ero, demo)
- **roles**: Role definitions and permissions
- **sessions**: Active user sessions with JWT tokens
- **tax_returns**: Tax return data with encryption
- **documents**: Uploaded documents with R2 references
- **irs_transmissions**: IRS MEF transmission logs
- **audit_logs**: Comprehensive audit trail
- **settings**: Application and user settings
- **notifications**: User notifications
- **compliance_records**: Disclosure acceptance records
- **refund_allocations**: Refund allocation preferences
- **bank_products**: Bank product selections

### Security Features

1. **Encryption**: Sensitive fields (SSN, account numbers, return data) are encrypted
2. **Password Hashing**: Using bcrypt for password storage
3. **Audit Logging**: All actions are logged with user, IP, and timestamp
4. **Role-Based Access Control**: Fine-grained permissions per role
5. **Session Management**: JWT tokens with expiration

### Default Roles

- **admin**: Full system access (permissions: ["*"])
- **ero**: Electronic Return Originator - can prepare and submit returns
- **client**: Tax client - can view returns and upload documents
- **demo**: Read-only demo access

## Development Workflow

1. Make schema changes in a new migration file (e.g., `002_add_new_table.sql`)
2. Test locally: `wrangler d1 execute ross-tax-prep-db --local --file=./database/migrations/002_add_new_table.sql`
3. Apply to production: `wrangler d1 execute ross-tax-prep-db --file=./database/migrations/002_add_new_table.sql`

## Troubleshooting

### Reset Local Database
```bash
rm -rf .wrangler/state/d1
wrangler d1 execute ross-tax-prep-db --local --file=./database/migrations/001_initial_schema.sql
```

### Check Table Structure
```bash
wrangler d1 execute ross-tax-prep-db --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
```
