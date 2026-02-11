# AWS RDS (Cloud SQL) Integration Guide

## Overview

This guide explains how to configure Ross Tax Prep to use AWS RDS (Relational Database Service) as an alternative to Cloudflare D1. AWS RDS provides a managed SQL database service with support for PostgreSQL, MySQL, and other database engines.

## Why AWS RDS?

**Benefits:**
- **Scalability**: Easily scale compute and storage
- **High Availability**: Multi-AZ deployments for 99.95% uptime SLA
- **Automated Backups**: Point-in-time recovery
- **Read Replicas**: Scale read workload across multiple regions
- **Enterprise Features**: Advanced monitoring, performance insights
- **Compliance**: HIPAA, PCI-DSS, SOC certifications

**Use Cases:**
- Large tax preparation firms (1000+ clients)
- Multi-region deployments
- Advanced analytics and reporting requirements
- Existing AWS infrastructure

## Supported Database Engines

1. **PostgreSQL** (Recommended)
   - Full SQL compliance
   - JSON/JSONB support for flexible schemas
   - Advanced indexing and query optimization
   - Cost: ~$15-50/month for small instances

2. **MySQL**
   - Wide compatibility
   - Mature ecosystem
   - Cost: ~$15-45/month for small instances

3. **Amazon Aurora** (PostgreSQL/MySQL compatible)
   - Higher performance (5x faster than standard PostgreSQL)
   - Serverless option available
   - Cost: ~$30-100/month

## Architecture

```
┌──────────────────┐
│ Cloudflare Worker│
│ (Edge)           │
└────────┬─────────┘
         │
         │ Connect via Hyperdrive
         │ (Connection Pooling)
         │
         ▼
┌──────────────────────────┐
│ Cloudflare Hyperdrive    │
│ (Database Connector)     │
└────────┬─────────────────┘
         │
         │ Secure Connection
         │ (TLS/SSL)
         │
         ▼
┌──────────────────────────┐
│ AWS RDS Instance         │
│ (PostgreSQL/MySQL)       │
│ - Primary: us-east-1     │
│ - Replica: us-west-2     │
└──────────────────────────┘
```

## Setup Guide

### Step 1: Create AWS RDS Instance

#### Using AWS Console

1. **Navigate to RDS Console:**
   - Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
   - Click "Create database"

2. **Choose Database Engine:**
   - Select **PostgreSQL** (recommended) or **MySQL**
   - Version: Latest stable (PostgreSQL 15+ or MySQL 8.0+)

3. **Configure Instance:**
   ```
   DB Instance Identifier: ross-tax-prep-db
   Master Username: rosstaxadmin
   Master Password: [Generate strong password]
   
   DB Instance Class: db.t4g.micro (Free tier) or db.t4g.small
   Storage: 20 GB (General Purpose SSD)
   Storage Autoscaling: Enable (max 100 GB)
   ```

4. **Network & Security:**
   ```
   VPC: Default or custom VPC
   Public Access: Yes (for Cloudflare Workers)
   VPC Security Group: Create new
     - Name: ross-tax-prep-sg
     - Inbound Rules:
       - Type: PostgreSQL (5432) or MySQL (3306)
       - Source: 0.0.0.0/0 (Cloudflare IPs - see below)
   ```

5. **Additional Configuration:**
   ```
   Initial Database Name: rosstaxprep
   Backup Retention: 7 days (adjust for compliance needs)
   Enable Encryption: Yes
   Enable Enhanced Monitoring: Yes
   Enable Performance Insights: Yes (optional, additional cost)
   ```

6. **Create Database**

#### Using AWS CLI

```bash
# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier ross-tax-prep-db \
  --db-instance-class db.t4g.small \
  --engine postgres \
  --engine-version 15.5 \
  --master-username rosstaxadmin \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --publicly-accessible \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-name rosstaxprep \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --region us-east-1

# Wait for instance to be available (takes 5-10 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier ross-tax-prep-db
```

### Step 2: Configure Security Group

#### Allow Cloudflare Worker IPs

Cloudflare Workers connect from dynamic IPs, but you can use Cloudflare's IP ranges:

```bash
# Get Cloudflare IP ranges
curl https://www.cloudflare.com/ips-v4

# Add rules to security group (example IPs)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr 173.245.48.0/20

# Repeat for all Cloudflare IP ranges
```

**Security Best Practice:** Use AWS VPC Peering or AWS PrivateLink for production to avoid public internet exposure.

### Step 3: Run Database Migrations

#### Connect to RDS Instance

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier ross-tax-prep-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Example: ross-tax-prep-db.c9akciq32.us-east-1.rds.amazonaws.com
```

#### Install PostgreSQL Client

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Run Migrations

```bash
# Set environment variables
export PGHOST=ross-tax-prep-db.c9akciq32.us-east-1.rds.amazonaws.com
export PGPORT=5432
export PGUSER=rosstaxadmin
export PGPASSWORD=YourSecurePassword123!
export PGDATABASE=rosstaxprep

# Connect and verify
psql -c "SELECT version();"

# Run initial schema migration (adapted for PostgreSQL)
psql -f database/migrations/rds/001_initial_schema.sql

# Run subsequent migrations
psql -f database/migrations/rds/002_workflow_system.sql
psql -f database/migrations/rds/003_lms_system.sql
```

### Step 4: Set Up Cloudflare Hyperdrive

Hyperdrive provides connection pooling and caching for database connections from Cloudflare Workers.

```bash
# Create Hyperdrive configuration
wrangler hyperdrive create ross-tax-prep-hyperdrive \
  --connection-string="postgres://rosstaxadmin:YourPassword@ross-tax-prep-db.c9akciq32.us-east-1.rds.amazonaws.com:5432/rosstaxprep?sslmode=require"

# Output: Hyperdrive ID (copy this)
# Example: 1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p
```

#### Update wrangler.toml

Add Hyperdrive binding:

```toml
# Add to wrangler.toml
[[hyperdrive]]
binding = "DB"
id = "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
```

### Step 5: Update Application Code

#### Database Abstraction Layer

Create a database adapter that works with both D1 and RDS:

```typescript
// functions/lib/db-adapter.ts

interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any>;
  execute(sql: string, params?: any[]): Promise<void>;
}

class D1Adapter implements DatabaseAdapter {
  constructor(private db: D1Database) {}
  
  async query(sql: string, params: any[] = []) {
    const stmt = this.db.prepare(sql).bind(...params);
    return await stmt.all();
  }
  
  async execute(sql: string, params: any[] = []) {
    const stmt = this.db.prepare(sql).bind(...params);
    await stmt.run();
  }
}

class RDSAdapter implements DatabaseAdapter {
  constructor(private hyperdrive: Hyperdrive) {}
  
  async query(sql: string, params: any[] = []) {
    // Convert ? placeholders to $1, $2, etc. for PostgreSQL
    let pgSql = sql;
    let paramIndex = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
    
    const conn = await this.hyperdrive.connect();
    const result = await conn.query(pgSql, params);
    conn.release();
    return { results: result.rows };
  }
  
  async execute(sql: string, params: any[] = []) {
    let pgSql = sql;
    let paramIndex = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
    
    const conn = await this.hyperdrive.connect();
    await conn.query(pgSql, params);
    conn.release();
  }
}

export function createDatabaseAdapter(env: any): DatabaseAdapter {
  // Check if Hyperdrive is available (RDS)
  if (env.HYPERDRIVE) {
    return new RDSAdapter(env.HYPERDRIVE);
  }
  // Fall back to D1
  return new D1Adapter(env.DB);
}
```

### Step 6: Set Environment Variables

```bash
# Set RDS connection details as Cloudflare secrets
wrangler secret put DB_TYPE
# Enter: rds

wrangler secret put RDS_HOST
# Enter: ross-tax-prep-db.c9akciq32.us-east-1.rds.amazonaws.com

wrangler secret put RDS_PORT
# Enter: 5432

wrangler secret put RDS_DATABASE
# Enter: rosstaxprep

wrangler secret put RDS_USERNAME
# Enter: rosstaxadmin

wrangler secret put RDS_PASSWORD
# Enter: YourSecurePassword123!
```

## PostgreSQL Migration Scripts

### Adapted Schema Migration

SQLite (D1) and PostgreSQL have different syntax. Here are key differences:

```sql
-- D1 (SQLite)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  data TEXT
);

-- PostgreSQL (RDS)
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSONB
);
```

Create `database/migrations/rds/001_initial_schema.sql`:

```sql
-- PostgreSQL version of initial schema
-- See full file in repository

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role_id VARCHAR(255) NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

-- Add update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Cost Analysis

### AWS RDS Pricing (us-east-1)

| Instance Type | vCPUs | RAM | Storage | Monthly Cost |
|---------------|-------|-----|---------|--------------|
| db.t4g.micro | 2 | 1 GB | 20 GB | ~$12 |
| db.t4g.small | 2 | 2 GB | 20 GB | ~$24 |
| db.t4g.medium | 2 | 4 GB | 50 GB | ~$48 |
| db.r6g.large | 2 | 16 GB | 100 GB | ~$150 |

**Additional Costs:**
- Storage: $0.115/GB-month (GP3)
- Backup Storage: $0.095/GB-month (beyond free 100% of DB size)
- Data Transfer: $0.09/GB outbound (first 100GB free)
- Cloudflare Hyperdrive: Free during beta, pricing TBA

**Total Estimated Cost:**
- Small deployment (1-100 clients): $15-30/month
- Medium deployment (100-1000 clients): $50-100/month
- Large deployment (1000+ clients): $150-300/month

## Performance Optimization

### Connection Pooling

Cloudflare Hyperdrive provides automatic connection pooling:

```toml
# wrangler.toml
[[hyperdrive]]
binding = "DB"
id = "your-hyperdrive-id"
# Hyperdrive manages pool size automatically
```

### Read Replicas

For read-heavy workloads:

```bash
# Create read replica in different region
aws rds create-db-instance-read-replica \
  --db-instance-identifier ross-tax-prep-db-replica \
  --source-db-instance-identifier ross-tax-prep-db \
  --db-instance-class db.t4g.small \
  --region us-west-2

# Configure Hyperdrive for read replica
wrangler hyperdrive create ross-tax-prep-read-replica \
  --connection-string="postgres://rosstaxadmin:Pass@ross-tax-prep-db-replica.xxx.us-west-2.rds.amazonaws.com:5432/rosstaxprep"
```

### Caching Strategy

```typescript
// Cache frequently accessed data in Cloudflare KV
async function getCachedUser(userId: string, env: Env) {
  // Check cache first
  const cached = await env.CACHE.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  // Query RDS
  const db = createDatabaseAdapter(env);
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  // Cache for 5 minutes
  await env.CACHE.put(`user:${userId}`, JSON.stringify(result.rows[0]), {
    expirationTtl: 300
  });
  
  return result.rows[0];
}
```

## Security Best Practices

### 1. Enable SSL/TLS

```bash
# Download RDS certificate
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Connection string with SSL
postgres://user:pass@host:5432/db?sslmode=verify-full&sslrootcert=global-bundle.pem
```

### 2. Use IAM Authentication (Advanced)

```bash
# Enable IAM authentication
aws rds modify-db-instance \
  --db-instance-identifier ross-tax-prep-db \
  --enable-iam-database-authentication

# Generate auth token
aws rds generate-db-auth-token \
  --hostname ross-tax-prep-db.xxx.rds.amazonaws.com \
  --port 5432 \
  --username iamuser \
  --region us-east-1
```

### 3. Encryption at Rest

- Enable during creation (cannot be added later)
- Uses AWS KMS for key management
- No performance impact
- Small additional cost (~$1/month)

### 4. Network Isolation

```bash
# Use AWS PrivateLink (advanced)
# Requires VPC peering between Cloudflare and AWS
# Contact Cloudflare Enterprise support
```

## Monitoring & Alerts

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ross-tax-prep-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=ross-tax-prep-db \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# High connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ross-tax-prep-high-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 60 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=ross-tax-prep-db \
  --evaluation-periods 2
```

### Performance Insights

Enable in RDS console for:
- Query analysis
- Wait event analysis
- Top SQL statements
- Connection tracking

## Backup & Recovery

### Automated Backups

```bash
# Modify backup retention
aws rds modify-db-instance \
  --db-instance-identifier ross-tax-prep-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

### Manual Snapshots

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier ross-tax-prep-db \
  --db-snapshot-identifier ross-tax-prep-backup-2024-02-11

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ross-tax-prep-db-restored \
  --db-snapshot-identifier ross-tax-prep-backup-2024-02-11
```

### Point-in-Time Recovery

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ross-tax-prep-db \
  --target-db-instance-identifier ross-tax-prep-db-restored \
  --restore-time 2024-02-11T10:30:00Z
```

## Troubleshooting

### Connection Timeouts

**Issue:** Workers timing out when connecting to RDS

**Solution:**
1. Verify security group allows Cloudflare IPs
2. Check RDS instance is publicly accessible
3. Use Hyperdrive for connection pooling
4. Increase Worker timeout in wrangler.toml

### High Latency

**Issue:** Slow query performance

**Solution:**
1. Enable RDS Performance Insights
2. Add indexes to frequently queried columns
3. Use read replicas for read-heavy operations
4. Cache results in Cloudflare KV
5. Consider Aurora for better performance

### SSL Certificate Errors

**Issue:** SSL verification fails

**Solution:**
```bash
# Use require mode instead of verify-full
?sslmode=require

# Or download certificate bundle
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

## Migration from D1 to RDS

### Data Export

```bash
# Export from D1
wrangler d1 export ross-tax-prep-db --output=d1-export.sql

# Convert SQLite SQL to PostgreSQL (manual editing required)
# Key differences:
# - TEXT → VARCHAR or JSONB
# - INTEGER → BIGINT or INT
# - AUTOINCREMENT → SERIAL or uuid_generate_v4()
# - datetime('now') → CURRENT_TIMESTAMP
```

### Gradual Migration

1. **Dual-write mode:** Write to both D1 and RDS
2. **Backfill:** Copy historical data to RDS
3. **Validation:** Compare data consistency
4. **Read cutover:** Switch reads to RDS
5. **Cleanup:** Remove D1 write operations

## Support Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Ross Tax Prep Database Schema](./database/README.md)

## Next Steps

1. ✅ Create AWS RDS instance
2. ✅ Configure security groups
3. ✅ Set up Cloudflare Hyperdrive
4. ✅ Run database migrations
5. ✅ Update application code
6. ⬜ Test error logging with RDS
7. ⬜ Set up monitoring and alerts
8. ⬜ Configure automated backups
9. ⬜ Optimize query performance

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
