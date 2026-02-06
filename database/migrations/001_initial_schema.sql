-- Ross Tax Prep D1 Database Schema
-- Migration: 001_initial_schema.sql

-- Users table: Stores user accounts (clients, admins, EROs)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    ssn_encrypted TEXT, -- Encrypted SSN
    date_of_birth TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'client', 'ero', 'demo')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'pending')),
    mfa_enabled INTEGER DEFAULT 0, -- 0=false, 1=true
    mfa_secret TEXT, -- TOTP secret
    last_login_at TEXT,
    password_reset_token TEXT,
    password_reset_expires TEXT,
    email_verified INTEGER DEFAULT 0,
    email_verification_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Roles table: Defines role permissions
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT NOT NULL, -- JSON array of permissions
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions table: Tracks active user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tax returns table: Stores tax return data
CREATE TABLE IF NOT EXISTS tax_returns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tax_year INTEGER NOT NULL,
    filing_status TEXT NOT NULL,
    return_type TEXT NOT NULL, -- '1040', '1040-SR', etc.
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'in_progress', 'ready', 'submitted', 'accepted', 'rejected', 'amended')),
    data_encrypted TEXT, -- Encrypted JSON of return data
    irs_submission_id TEXT,
    irs_ack_code TEXT,
    irs_ack_message TEXT,
    submitted_at TEXT,
    accepted_at TEXT,
    ero_id TEXT, -- ERO who prepared the return
    efin TEXT, -- Electronic Filing Identification Number
    preparer_ptin TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ero_id) REFERENCES users(id)
);

-- Documents table: Tracks uploaded documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    return_id TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    r2_key TEXT NOT NULL, -- R2 storage key
    bucket_name TEXT NOT NULL,
    document_type TEXT, -- 'w2', '1099', 'id', 'supporting', etc.
    encrypted INTEGER DEFAULT 1, -- 0=false, 1=true
    uploaded_by TEXT NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    virus_scanned INTEGER DEFAULT 0,
    virus_scan_result TEXT,
    metadata TEXT, -- JSON metadata
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- IRS transmissions table: Tracks IRS e-file transmissions
CREATE TABLE IF NOT EXISTS irs_transmissions (
    id TEXT PRIMARY KEY,
    return_id TEXT NOT NULL,
    transmission_id TEXT UNIQUE NOT NULL,
    submission_id TEXT UNIQUE NOT NULL,
    test_indicator TEXT NOT NULL CHECK(test_indicator IN ('T', 'P')), -- T=Test, P=Production
    mef_version TEXT NOT NULL,
    xml_data TEXT NOT NULL, -- Full MEF XML
    checksum TEXT NOT NULL,
    checksum_algorithm TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'transmitted', 'acknowledged', 'rejected', 'error')),
    ack_code TEXT,
    ack_message TEXT,
    ack_timestamp TEXT,
    transmitted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- Audit logs table: Comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT, -- JSON details
    severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Settings table: Application and user settings
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- NULL for global settings
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, key)
);

-- Notifications table: User notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'email', 'sms', 'in_app'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    metadata TEXT, -- JSON metadata
    sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Compliance records table: Track compliance requirements
CREATE TABLE IF NOT EXISTS compliance_records (
    id TEXT PRIMARY KEY,
    return_id TEXT NOT NULL,
    disclosure_id TEXT NOT NULL,
    disclosure_version TEXT NOT NULL,
    accepted_by TEXT NOT NULL,
    accepted_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT, -- JSON metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE,
    FOREIGN KEY (accepted_by) REFERENCES users(id)
);

-- Refund allocation table: Track refund allocation choices
CREATE TABLE IF NOT EXISTS refund_allocations (
    id TEXT PRIMARY KEY,
    return_id TEXT NOT NULL,
    allocation_type TEXT NOT NULL, -- 'direct_deposit', 'check', 'split', 'savings_bonds'
    account_type TEXT, -- 'checking', 'savings'
    routing_number_encrypted TEXT,
    account_number_encrypted TEXT,
    amount REAL,
    bank_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
    metadata TEXT, -- JSON metadata for splits, bonds, etc.
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- Bank products table: Track bank product selections
CREATE TABLE IF NOT EXISTS bank_products (
    id TEXT PRIMARY KEY,
    return_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_type TEXT NOT NULL, -- 'refund_transfer', 'refund_advance', etc.
    payout_method TEXT,
    amount REAL,
    fee REAL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied', 'completed')),
    application_data TEXT, -- JSON application data
    decision_code TEXT,
    decision_message TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_tax_returns_user_id ON tax_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_return_id ON documents(return_id);
CREATE INDEX IF NOT EXISTS idx_irs_transmissions_return_id ON irs_transmissions(return_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_return_id ON compliance_records(return_id);
CREATE INDEX IF NOT EXISTS idx_refund_allocations_return_id ON refund_allocations(return_id);
CREATE INDEX IF NOT EXISTS idx_bank_products_return_id ON bank_products(return_id);

-- Insert default roles
INSERT OR IGNORE INTO roles (id, name, description, permissions) VALUES
    ('role_admin', 'admin', 'Full system administrator', '["*"]'),
    ('role_ero', 'ero', 'Electronic Return Originator', '["returns.create", "returns.read", "returns.update", "returns.submit", "clients.read", "clients.create", "documents.read", "documents.upload", "irs.transmit"]'),
    ('role_client', 'client', 'Tax preparation client', '["returns.read", "documents.upload", "documents.read", "notifications.read"]'),
    ('role_demo', 'demo', 'Demo user with limited access', '["returns.read", "documents.read"]');

-- Insert default admin user (password: Admin@123 - MUST BE CHANGED IN PRODUCTION)
-- Password hash is bcrypt hash of 'Admin@123'
INSERT OR IGNORE INTO users (
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    email_verified
) VALUES (
    'user_admin_default',
    'admin@rosstax.com',
    '$2a$10$YourHashHere', -- Replace with actual bcrypt hash
    'System',
    'Administrator',
    'admin',
    'active',
    1
);
