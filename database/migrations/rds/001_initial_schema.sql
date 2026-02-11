-- Ross Tax Prep PostgreSQL Database Schema
-- Migration: 001_initial_schema.sql
-- Adapted from D1/SQLite schema for PostgreSQL/AWS RDS

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table: Stores user accounts (clients, admins, EROs)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    ssn_encrypted TEXT, -- Encrypted SSN
    date_of_birth DATE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'client', 'ero', 'demo')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'pending')),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255), -- TOTP secret
    last_login_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles table: Defines role permissions
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL, -- JSON array of permissions
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table: Tracks active user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tax returns table: Stores tax return data
CREATE TABLE IF NOT EXISTS tax_returns (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR(255) NOT NULL,
    tax_year INTEGER NOT NULL,
    filing_status VARCHAR(50) NOT NULL,
    return_data_encrypted TEXT, -- Encrypted JSON of full return
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'ready', 'filed', 'accepted', 'rejected', 'amended')),
    federal_refund DECIMAL(12, 2),
    state_refund DECIMAL(12, 2),
    filed_date TIMESTAMP,
    accepted_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Documents table: References to uploaded documents in R2
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR(255) NOT NULL,
    return_id VARCHAR(255),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    r2_key VARCHAR(500) NOT NULL, -- R2 object key
    r2_bucket VARCHAR(100) NOT NULL,
    document_type VARCHAR(100), -- w2, 1099, receipt, etc.
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- IRS transmissions table: Tracks e-file submissions
CREATE TABLE IF NOT EXISTS irs_transmissions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    return_id VARCHAR(255) NOT NULL,
    submission_id VARCHAR(255) UNIQUE,
    transmission_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledgment_timestamp TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'transmitted', 'accepted', 'rejected', 'error')),
    error_code VARCHAR(50),
    error_message TEXT,
    raw_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- Audit logs table: Comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    severity VARCHAR(50) DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Settings table: Application and user settings
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR(255),
    key VARCHAR(255) NOT NULL,
    value TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, key)
);

-- Notifications table: User notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Compliance records table: Tracks disclosure acceptance
CREATE TABLE IF NOT EXISTS compliance_records (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR(255) NOT NULL,
    return_id VARCHAR(255),
    disclosure_type VARCHAR(100) NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    acceptance_timestamp TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- Refund allocations table: Savings bonds and split deposits
CREATE TABLE IF NOT EXISTS refund_allocations (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    return_id VARCHAR(255) NOT NULL,
    allocation_type VARCHAR(50) NOT NULL CHECK(allocation_type IN ('bond', 'direct_deposit', 'check')),
    amount DECIMAL(12, 2) NOT NULL,
    routing_number_encrypted VARCHAR(255),
    account_number_encrypted VARCHAR(255),
    account_type VARCHAR(50),
    bond_denomination INTEGER,
    recipient_ssn_encrypted VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- Bank products table: Bank product selections
CREATE TABLE IF NOT EXISTS bank_products (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    return_id VARCHAR(255) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2),
    fees DECIMAL(12, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMP,
    funded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_tax_returns_user_id ON tax_returns(user_id);
CREATE INDEX idx_tax_returns_tax_year ON tax_returns(tax_year);
CREATE INDEX idx_tax_returns_status ON tax_returns(status);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_return_id ON documents(return_id);
CREATE INDEX idx_irs_transmissions_return_id ON irs_transmissions(return_id);
CREATE INDEX idx_irs_transmissions_status ON irs_transmissions(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_compliance_records_user_id ON compliance_records(user_id);
CREATE INDEX idx_compliance_records_return_id ON compliance_records(return_id);
CREATE INDEX idx_refund_allocations_return_id ON refund_allocations(return_id);
CREATE INDEX idx_bank_products_return_id ON bank_products(return_id);

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_returns_updated_at BEFORE UPDATE ON tax_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irs_transmissions_updated_at BEFORE UPDATE ON irs_transmissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_allocations_updated_at BEFORE UPDATE ON refund_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_products_updated_at BEFORE UPDATE ON bank_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (id, name, description, permissions) VALUES
  ('role_admin', 'admin', 'Full system administrator', '["*"]'),
  ('role_ero', 'ero', 'Electronic Return Originator', '["returns.create", "returns.read", "returns.update", "returns.submit", "users.read", "documents.upload"]'),
  ('role_client', 'client', 'Tax client', '["returns.read", "documents.upload", "documents.read"]'),
  ('role_demo', 'demo', 'Demo user with read-only access', '["returns.read"]')
ON CONFLICT (id) DO NOTHING;

-- Create default admin user (password: Admin@123 - CHANGE IN PRODUCTION)
-- Password hash for 'Admin@123' using bcrypt
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, email_verified) VALUES
  ('user_admin', 'admin@rosstaxprep.com', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP', 'System', 'Administrator', 'admin', 'active', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts including clients, admins, and EROs';
COMMENT ON TABLE tax_returns IS 'Tax return data with encrypted sensitive information';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';
COMMENT ON COLUMN users.ssn_encrypted IS 'Encrypted SSN using AES-256-GCM';
COMMENT ON COLUMN tax_returns.return_data_encrypted IS 'Full return data encrypted with AES-256-GCM';
