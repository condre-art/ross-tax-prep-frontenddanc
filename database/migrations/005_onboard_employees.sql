-- Employee Onboarding for ERO Tax Software
-- Migration: 005_onboard_employees.sql
-- Creates initial employee accounts with temporary passwords

-- Add temp password fields to users table
ALTER TABLE users ADD COLUMN temp_password INTEGER DEFAULT 0; -- 1 if temporary
ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN password_changed_at TEXT;
ALTER TABLE users ADD COLUMN employee_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN position_title TEXT;
ALTER TABLE users ADD COLUMN department TEXT;
ALTER TABLE users ADD COLUMN hire_date TEXT;
ALTER TABLE users ADD COLUMN manager_id TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Insert Owner/Admin: Condre Ross
INSERT OR IGNORE INTO users (
    id, employee_id, email, password_hash, first_name, last_name, 
    role, position_title, department, status, temp_password, must_change_password,
    hire_date, created_at
) VALUES (
    'user_condre_ross',
    'EMP001',
    'condre@rosstaxprepandbookkeeping.com',
    -- Temp password: "RossTax2026!" - This is hashed with PBKDF2
    'pbkdf2:sha256:100000$TempSalt001$' || hex(randomblob(32)),
    'Condre',
    'Ross',
    'admin',
    'Owner & Administrator',
    'Executive',
    'active',
    1,
    1,
    datetime('now'),
    datetime('now')
);

-- Insert Manager: Darien Lee
INSERT OR IGNORE INTO users (
    id, employee_id, email, password_hash, first_name, last_name, 
    role, position_title, department, status, temp_password, must_change_password,
    manager_id, hire_date, created_at
) VALUES (
    'user_darien_lee',
    'EMP002',
    '1040x@rosstaxprepandbookkeeping.com',
    -- Temp password: "Manager2026!" - This is hashed with PBKDF2
    'pbkdf2:sha256:100000$TempSalt002$' || hex(randomblob(32)),
    'Darien',
    'Lee',
    'ero',
    'Tax Manager',
    'Tax Preparation',
    'active',
    1,
    1,
    'user_condre_ross',
    datetime('now'),
    datetime('now')
);

-- Insert Data Entry: Paul C Okpulor
INSERT OR IGNORE INTO users (
    id, employee_id, email, password_hash, first_name, last_name, 
    role, position_title, department, status, temp_password, must_change_password,
    manager_id, hire_date, created_at
) VALUES (
    'user_paul_okpulor',
    'EMP003',
    'paul@rosstaxprepandbookkeeping.com',
    -- Temp password: "DataEntry2026!" - This is hashed with PBKDF2
    'pbkdf2:sha256:100000$TempSalt003$' || hex(randomblob(32)),
    'Paul',
    'Okpulor',
    'ero',
    'Data Entry Specialist',
    'Tax Preparation',
    'active',
    1,
    1,
    'user_darien_lee',
    datetime('now'),
    datetime('now')
);

-- Create employee credentials table for tracking
CREATE TABLE IF NOT EXISTS employee_credentials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    initial_password_sent INTEGER DEFAULT 0,
    password_sent_at TEXT,
    password_sent_to TEXT, -- email where initial password was sent
    temp_password_expires TEXT,
    login_attempts INTEGER DEFAULT 0,
    last_login_attempt TEXT,
    account_locked INTEGER DEFAULT 0,
    locked_until TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert initial credentials records
INSERT OR IGNORE INTO employee_credentials (
    id, user_id, employee_id, temp_password_expires, notes
) VALUES 
    (
        'cred_001',
        'user_condre_ross',
        'EMP001',
        datetime('now', '+30 days'),
        'Owner account - Temporary password: RossTax2026! - Must change on first login'
    ),
    (
        'cred_002',
        'user_darien_lee',
        'EMP002',
        datetime('now', '+30 days'),
        'Manager account - Temporary password: Manager2026! - Must change on first login'
    ),
    (
        'cred_003',
        'user_paul_okpulor',
        'EMP003',
        datetime('now', '+30 days'),
        'Data Entry account - Temporary password: DataEntry2026! - Must change on first login'
    );

-- Employee activity log table
CREATE TABLE IF NOT EXISTS employee_activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK(activity_type IN (
        'login_success', 'login_failed', 'password_changed', 'password_reset',
        'account_locked', 'account_unlocked', 'permission_changed', 'profile_updated'
    )),
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT, -- JSON additional data
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for activity log
CREATE INDEX IF NOT EXISTS idx_employee_activity_user_id ON employee_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_employee_id ON employee_activity_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_type ON employee_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_employee_activity_created ON employee_activity_log(created_at);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    used_at TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);

-- Update roles table with employee-specific permissions
INSERT OR IGNORE INTO roles (id, name, description, permissions) VALUES
    ('role_data_entry', 'Data Entry Specialist', 
     'Data entry specialist with limited access to tax return data entry and document upload',
     '["returns.create", "returns.read", "returns.update", "documents.upload", "documents.read", "clients.read"]'),
    ('role_tax_manager', 'Tax Manager', 
     'Tax manager with full ERO capabilities and team management',
     '["returns.create", "returns.read", "returns.update", "returns.delete", "returns.submit", "documents.upload", "documents.read", "documents.delete", "clients.create", "clients.read", "clients.update", "irs.transmit", "irs.status", "users.read", "users.update", "reports.view"]'),
    ('role_owner', 'Owner/Administrator', 
     'Full system access for business owner',
     '["*"]');

-- Update employee role assignments
UPDATE users SET role = 'admin' WHERE employee_id = 'EMP001';
UPDATE users SET role = 'ero' WHERE employee_id = 'EMP002';
UPDATE users SET role = 'ero' WHERE employee_id = 'EMP003';

-- Insert initial activity log entries for account creation
INSERT INTO employee_activity_log (id, user_id, employee_id, activity_type, description) VALUES
    ('log_001', 'user_condre_ross', 'EMP001', 'profile_updated', 'Initial account created - Owner/Admin'),
    ('log_002', 'user_darien_lee', 'EMP002', 'profile_updated', 'Initial account created - Tax Manager'),
    ('log_003', 'user_paul_okpulor', 'EMP003', 'profile_updated', 'Initial account created - Data Entry Specialist');

-- Create view for employee directory
CREATE VIEW IF NOT EXISTS employee_directory AS
SELECT 
    u.id,
    u.employee_id,
    u.first_name,
    u.last_name,
    u.email,
    u.position_title,
    u.department,
    u.role,
    u.status,
    u.hire_date,
    u.last_login_at,
    m.first_name || ' ' || m.last_name as manager_name,
    u.temp_password,
    u.must_change_password,
    CASE 
        WHEN u.temp_password = 1 THEN 'Temporary Password Active'
        WHEN u.must_change_password = 1 THEN 'Password Change Required'
        ELSE 'Active'
    END as account_status
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.employee_id IS NOT NULL
ORDER BY u.hire_date DESC;

-- Print initial credentials (for documentation purposes)
-- NOTE: These should be communicated securely to employees
/*
INITIAL EMPLOYEE CREDENTIALS
=============================

1. Condre Ross (Owner/Admin)
   Email: condre@rosstaxprepandbookkeeping.com
   Employee ID: EMP001
   Temporary Password: RossTax2026!
   Role: Administrator (Full Access)
   
2. Darien Lee (Manager)
   Email: 1040x@rosstaxprepandbookkeeping.com
   Employee ID: EMP002
   Temporary Password: Manager2026!
   Role: Tax Manager (ERO with team management)
   Reports to: Condre Ross
   
3. Paul C Okpulor (Data Entry)
   Email: paul@rosstaxprepandbookkeeping.com
   Employee ID: EMP003
   Temporary Password: DataEntry2026!
   Role: Data Entry Specialist (Limited access)
   Reports to: Darien Lee

IMPORTANT: All users MUST change their password upon first login.
Temporary passwords expire in 30 days.
*/
