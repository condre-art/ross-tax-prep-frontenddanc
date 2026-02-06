-- Ross Tax Prep Workflow System
-- Migration: 002_workflow_system.sql
-- Adds comprehensive workflow management for return filing and e-filing processes

-- Workflow Templates table: Defines reusable workflow templates
CREATE TABLE IF NOT EXISTS workflow_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('return_filing', 'efile', 'amendment', 'audit', 'custom')),
    version INTEGER NOT NULL DEFAULT 1,
    steps TEXT NOT NULL, -- JSON array of workflow steps with order, requirements, etc.
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Workflow Instances table: Tracks active workflows for returns
CREATE TABLE IF NOT EXISTS workflow_instances (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    return_id TEXT,
    name TEXT NOT NULL,
    current_step TEXT NOT NULL, -- Current step ID or name
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold', 'failed')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to TEXT, -- User ID responsible for this workflow
    started_at TEXT,
    completed_at TEXT,
    cancelled_at TEXT,
    due_date TEXT,
    metadata TEXT, -- JSON metadata (provider info, client details, etc.)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (template_id) REFERENCES workflow_templates(id),
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Workflow Tasks table: Individual tasks within a workflow
CREATE TABLE IF NOT EXISTS workflow_tasks (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL CHECK(task_type IN ('data_entry', 'review', 'approval', 'signature', 'document_upload', 'efile', 'notification', 'custom')),
    step_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed', 'blocked')),
    assigned_to TEXT,
    depends_on TEXT, -- JSON array of task IDs that must be completed first
    required_role TEXT, -- Role required to complete this task
    required_permissions TEXT, -- JSON array of permissions needed
    due_date TEXT,
    started_at TEXT,
    completed_at TEXT,
    completed_by TEXT,
    result TEXT, -- JSON result data from task completion
    metadata TEXT, -- JSON metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workflow_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- Workflow Transitions table: Audit trail of workflow state changes
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    from_step TEXT,
    to_step TEXT NOT NULL,
    action TEXT NOT NULL,
    triggered_by TEXT,
    reason TEXT,
    metadata TEXT, -- JSON metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workflow_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by) REFERENCES users(id)
);

-- E-File Providers table: Configuration for different e-file providers
CREATE TABLE IF NOT EXISTS efile_providers (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('irs_mef', 'taxslayer', 'drake', 'thomson_reuters', 'intuit', 'other')),
    endpoint_url TEXT,
    api_key_encrypted TEXT,
    credentials_encrypted TEXT, -- JSON encrypted credentials
    is_active INTEGER DEFAULT 1,
    test_mode INTEGER DEFAULT 1,
    configuration TEXT, -- JSON configuration
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- E-File Submissions table: Track submissions to various providers
CREATE TABLE IF NOT EXISTS efile_submissions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT,
    return_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    submission_type TEXT NOT NULL CHECK(submission_type IN ('original', 'amended', 'extension', 'correction')),
    submission_id TEXT, -- Provider's submission ID
    transmission_id TEXT, -- Unique transmission identifier
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'validating', 'submitted', 'accepted', 'rejected', 'error', 'cancelled')),
    xml_data TEXT, -- MEF XML or provider-specific format
    validation_errors TEXT, -- JSON array of validation errors
    submission_response TEXT, -- JSON response from provider
    ack_code TEXT,
    ack_message TEXT,
    ack_received_at TEXT,
    submitted_by TEXT NOT NULL,
    submitted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workflow_id) REFERENCES workflow_instances(id) ON DELETE SET NULL,
    FOREIGN KEY (return_id) REFERENCES tax_returns(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES efile_providers(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_templates_type ON workflow_templates(type);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_return_id ON workflow_instances(return_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_assigned_to ON workflow_instances(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow_id ON workflow_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow_id ON workflow_transitions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_efile_providers_type ON efile_providers(type);
CREATE INDEX IF NOT EXISTS idx_efile_submissions_return_id ON efile_submissions(return_id);
CREATE INDEX IF NOT EXISTS idx_efile_submissions_workflow_id ON efile_submissions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_efile_submissions_status ON efile_submissions(status);

-- Insert default workflow template for return filing
INSERT OR IGNORE INTO workflow_templates (id, name, description, type, steps) VALUES (
    'template_return_filing',
    'Standard Return Filing Workflow',
    'Complete workflow for filing a tax return from data entry to e-file submission',
    'return_filing',
    '[
        {"id": "intake", "name": "Client Intake", "description": "Gather client information and documents", "order": 1, "required": true},
        {"id": "data_entry", "name": "Data Entry", "description": "Enter tax return data", "order": 2, "required": true},
        {"id": "review", "name": "Review & Calculation", "description": "Review return and verify calculations", "order": 3, "required": true},
        {"id": "client_approval", "name": "Client Approval", "description": "Client reviews and approves return", "order": 4, "required": true},
        {"id": "signature", "name": "E-Signature", "description": "Client signs Form 8879", "order": 5, "required": true},
        {"id": "efile", "name": "E-File Submission", "description": "Submit return to IRS or provider", "order": 6, "required": true},
        {"id": "acknowledgment", "name": "Acknowledgment", "description": "Receive and process acknowledgment", "order": 7, "required": true},
        {"id": "complete", "name": "Complete", "description": "Workflow completed successfully", "order": 8, "required": false}
    ]'
);

-- Insert default workflow template for e-filing only
INSERT OR IGNORE INTO workflow_templates (id, name, description, type, steps) VALUES (
    'template_efile_only',
    'E-File Submission Workflow',
    'Simplified workflow for e-filing a completed return',
    'efile',
    '[
        {"id": "validation", "name": "Validation", "description": "Validate return data", "order": 1, "required": true},
        {"id": "provider_select", "name": "Provider Selection", "description": "Select e-file provider", "order": 2, "required": true},
        {"id": "submission", "name": "Submit", "description": "Submit to provider", "order": 3, "required": true},
        {"id": "acknowledgment", "name": "Acknowledgment", "description": "Process acknowledgment", "order": 4, "required": true}
    ]'
);

-- Insert default e-file providers
INSERT OR IGNORE INTO efile_providers (id, name, type, endpoint_url, is_active, test_mode, configuration) VALUES
    ('provider_irs_mef', 'IRS Modernized e-File', 'irs_mef', 'https://testfire.irs.gov/a2aservices', 1, 1, '{"mef_version": "2024v5.0", "schema_validation": true}'),
    ('provider_taxslayer', 'TaxSlayer Pro', 'taxslayer', 'https://api.taxslayerpro.com/efile/v1', 1, 1, '{"supports_state": true, "supports_amendments": true}');

-- Add workflow permissions to existing roles
-- Note: This assumes the roles table from migration 001_initial_schema.sql exists
UPDATE roles SET permissions = json_insert(
    permissions, 
    '$[#]', 'workflows.create',
    '$[#]', 'workflows.read',
    '$[#]', 'workflows.update',
    '$[#]', 'workflows.delete',
    '$[#]', 'workflows.assign',
    '$[#]', 'tasks.create',
    '$[#]', 'tasks.read',
    '$[#]', 'tasks.update',
    '$[#]', 'tasks.complete'
) WHERE (name = 'ero' OR name = 'admin') AND id IN (SELECT id FROM roles);

-- Add basic workflow read permissions to client role
UPDATE roles SET permissions = json_insert(
    permissions,
    '$[#]', 'workflows.read',
    '$[#]', 'tasks.read'
) WHERE name = 'client' AND id IN (SELECT id FROM roles);
