# Workflow System Documentation

## Overview

The Ross Tax Prep Workflow System provides comprehensive management for tax return filing workflows, task management, and e-filing to multiple providers including IRS MEF and TaxSlayer Pro.

## Features

### 1. Workflow Management
- **Workflow Templates**: Pre-defined workflows for different filing scenarios
  - Standard Return Filing Workflow (8 steps)
  - E-File Only Workflow (4 steps)
  - Custom workflow templates

- **Workflow Instances**: Active workflows linked to tax returns
  - Track current step and status
  - Assign workflows to ERO/Admin users
  - Set priorities and due dates
  - Monitor progress through each step

- **Workflow Transitions**: Complete audit trail
  - Record every state change
  - Track who triggered transitions
  - Store metadata and reasons for changes

### 2. Task Management
- **Task Types**:
  - `data_entry`: Enter tax return information
  - `review`: Review return for accuracy
  - `approval`: Client or ERO approval
  - `signature`: Electronic signature (Form 8879)
  - `document_upload`: Upload supporting documents
  - `efile`: Submit to e-file provider
  - `notification`: Send notifications
  - `custom`: Custom task types

- **Task Features**:
  - Assign tasks to specific users
  - Set dependencies between tasks
  - Define role-based permissions
  - Track completion status
  - Store task results and notes

### 3. E-File Provider Integration

#### Supported Providers
1. **IRS Modernized e-File (MEF)**
   - Direct submission to IRS
   - MEF Schema 2024v5.0 compliance
   - Test and production modes
   - Acknowledgment tracking

2. **TaxSlayer Pro**
   - API-based submission
   - Support for state returns
   - Amendment support
   - Acknowledgment processing

#### E-File Workflow
1. Validate return data
2. Select provider (IRS MEF or TaxSlayer)
3. Submit to provider
4. Track submission status
5. Process acknowledgment
6. Update return status

### 4. Role-Based Permissions

#### Role Permissions for Workflows
- **Admin**: All permissions
  - Create, read, update, delete workflows
  - Assign workflows to any user
  - Complete any task
  - Access all submissions

- **ERO (Electronic Return Originator)**: 
  - Create and manage workflows
  - Assign workflows to clients
  - Complete tasks requiring ERO approval
  - Submit e-files
  - View all submissions

- **Client**:
  - View assigned workflows
  - View and complete assigned tasks
  - View own submissions
  - Upload documents

- **Demo**:
  - Read-only access to workflows and tasks

## API Endpoints

### Workflow Endpoints

#### Create Workflow
```http
POST /api/workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "template_id": "template_return_filing",
  "name": "2024 Tax Return - John Smith",
  "return_id": "return_123",
  "assigned_to": "user_456",
  "priority": "normal",
  "due_date": "2026-04-15"
}
```

#### List Workflows
```http
GET /api/workflows?status=in_progress&assigned_to=user_123
Authorization: Bearer {token}
```

#### Get Workflow Details
```http
GET /api/workflows/{workflow_id}
Authorization: Bearer {token}
```

#### Transition Workflow
```http
POST /api/workflows/{workflow_id}/transition
Authorization: Bearer {token}
Content-Type: application/json

{
  "to_step": "client_approval",
  "action": "advance",
  "reason": "Data entry completed"
}
```

#### Get Workflow Tasks
```http
GET /api/workflows/{workflow_id}/tasks
Authorization: Bearer {token}
```

### Task Endpoints

#### Create Task
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "workflow_id": "workflow_123",
  "title": "Review tax calculations",
  "description": "Verify all calculations and deductions",
  "task_type": "review",
  "assigned_to": "user_456",
  "required_role": "ero",
  "due_date": "2026-03-15"
}
```

#### List Tasks
```http
GET /api/tasks?status=pending&assigned_to=user_123
Authorization: Bearer {token}
```

#### Complete Task
```http
POST /api/tasks/{task_id}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "result": {
    "verified": true,
    "issues_found": 0
  },
  "notes": "All calculations verified successfully"
}
```

### E-File Endpoints

#### List Providers
```http
GET /api/efile/providers
Authorization: Bearer {token}
```

#### Submit E-File
```http
POST /api/efile/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "return_id": "return_123",
  "provider_id": "provider_taxslayer",
  "submission_type": "original",
  "workflow_id": "workflow_456"
}
```

#### List Submissions
```http
GET /api/efile/submissions?status=submitted
Authorization: Bearer {token}
```

#### Get Submission Details
```http
GET /api/efile/submissions/{submission_id}
Authorization: Bearer {token}
```

## Database Schema

### workflow_templates
- Pre-defined workflow templates with steps
- Version control for templates
- Active/inactive status

### workflow_instances
- Active workflow instances
- Links to tax returns
- Current step tracking
- Status and priority management

### workflow_tasks
- Individual tasks within workflows
- Task dependencies
- Role-based assignment
- Completion tracking

### workflow_transitions
- Audit trail of all workflow state changes
- Records who triggered each transition
- Metadata for each transition

### efile_providers
- Configuration for e-file providers
- API credentials (encrypted)
- Test/production mode settings
- Provider-specific configuration

### efile_submissions
- Track all e-file submissions
- Link to workflows and returns
- Submission status tracking
- Acknowledgment data

## Standard Return Filing Workflow

### Step 1: Client Intake
- Gather client information
- Collect W-2s, 1099s, and other tax documents
- Create client profile in system

### Step 2: Data Entry
- Enter all tax information into system
- Input income, deductions, credits
- Calculate tax liability

### Step 3: Review & Calculation
- ERO reviews return for accuracy
- Verify all calculations
- Check for missed deductions or credits

### Step 4: Client Approval
- Client reviews completed return
- Client approves or requests changes
- Address any client questions

### Step 5: E-Signature
- Client signs Form 8879 electronically
- Store signature authorization
- Complete signing requirements

### Step 6: E-File Submission
- Select e-file provider (IRS MEF or TaxSlayer)
- Submit return electronically
- Generate transmission ID

### Step 7: Acknowledgment
- Receive acknowledgment from IRS/provider
- Check for acceptance or rejection
- Handle any rejection reasons

### Step 8: Complete
- Mark workflow as completed
- Archive return documents
- Notify client of completion

## UI Components

### Workflow Dashboard (`/app/workflows`)
- View all workflows (paginated, filterable)
- View all tasks (by status, assignment)
- Create new workflows
- Complete tasks
- Filter by status, priority, assignment

### E-File Portal (`/app/efile`)
- Submit tax returns to providers
- Select provider (IRS MEF, TaxSlayer)
- View submission history
- Track acknowledgment status
- Monitor e-file progress

## Configuration

### Environment Variables
```bash
# IRS MEF Configuration
IRS_EFIN=123456
IRS_ETIN=12345678
IRS_MEF_ENDPOINT=https://testfire.irs.gov/a2aservices
IRS_TEST_MODE=true

# Database
DB=D1Database

# Authentication
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### Provider Configuration
Providers are configured in the `efile_providers` table with:
- Endpoint URLs
- API credentials (encrypted)
- Test/production mode toggle
- Provider-specific settings (JSON)

## Security

### Permissions Required
- **workflows.create**: Create new workflows
- **workflows.read**: View workflows
- **workflows.update**: Update workflow state
- **workflows.delete**: Delete workflows
- **workflows.assign**: Assign workflows to users
- **tasks.create**: Create tasks
- **tasks.read**: View tasks
- **tasks.update**: Update tasks
- **tasks.complete**: Complete tasks
- **irs.transmit**: Submit e-files

### Audit Logging
All workflow and e-file operations are logged to `audit_logs` table:
- User who performed action
- Action type
- Resource affected
- Timestamp
- IP address and user agent

### Data Encryption
- Provider API credentials: AES-256-GCM
- Tax return data: AES-256-GCM
- Bank account information: AES-256-GCM

## Best Practices

1. **Always use workflows for return filing**: Track progress and ensure all steps are completed
2. **Assign tasks appropriately**: Ensure tasks are assigned to users with proper roles
3. **Monitor due dates**: Set realistic due dates and monitor task completion
4. **Use test mode**: Test e-filing in test mode before production submissions
5. **Review acknowledgments**: Always check e-file acknowledgments for acceptance/rejection
6. **Document decisions**: Use task completion notes to document important decisions
7. **Regular audits**: Review audit logs regularly for compliance

## Troubleshooting

### Common Issues

**Workflow creation fails**
- Verify template exists and is active
- Check user has `workflows.create` permission
- Ensure all required fields are provided

**Task completion fails**
- Verify user is assigned to task
- Check user has required role for task
- Ensure task dependencies are completed

**E-file submission fails**
- Verify provider is active
- Check return has required data
- Verify user has `irs.transmit` permission
- Check provider configuration

**Acknowledgment not received**
- Allow time for provider processing (15-60 minutes)
- Check submission status in database
- Verify provider endpoint is accessible
- Review submission response for errors

## Future Enhancements

- [ ] Workflow templates editor (UI-based)
- [ ] Automated task assignment based on workload
- [ ] Email notifications for workflow events
- [ ] SMS notifications for urgent tasks
- [ ] Integration with more e-file providers (Drake, Thomson Reuters)
- [ ] Workflow analytics and reporting
- [ ] Bulk workflow operations
- [ ] Custom workflow step definitions
- [ ] Mobile app for task management

## Support

For questions or issues with the workflow system:
1. Check this documentation
2. Review API endpoint documentation
3. Check audit logs for error details
4. Contact system administrator
