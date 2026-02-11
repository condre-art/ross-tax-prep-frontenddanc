# Cloud Agent Integration (MCP)

This document describes the Cloud Agent integration using the Model Context Protocol (MCP) for delegating complex tasks to AI agents.

## Overview

The Ross Tax Prep application supports delegating complex tasks to cloud-based AI agents via the Model Context Protocol (MCP). This allows for:

- **Tax calculations** - Complex tax liability calculations
- **Document analysis** - Automated extraction of tax information from documents
- **Form validation** - Comprehensive validation of tax forms
- **Compliance checking** - Verification of IRS compliance requirements

## Configuration

### Environment Variable

Set the `MCP_SERVER_URL` environment variable to your MCP server endpoint:

```toml
# wrangler.toml
[vars]
MCP_SERVER_URL = "https://your-mcp-server.example.com"
```

Or set it as a Cloudflare Pages environment variable in the dashboard.

### Optional Configuration

The MCP client supports the following configuration options (set in code):

- `timeout`: Request timeout in milliseconds (default: 30000)
- `retries`: Number of retry attempts (default: 2)

## API Endpoints

### General Delegation

**POST** `/api/cloud-agent/delegate`

Delegate any task to the cloud agent with a custom prompt.

**Request:**
```json
{
  "task_type": "tax_calculation",
  "prompt": "Calculate tax liability for...",
  "context": {
    "income": 75000,
    "deductions": 12000
  },
  "metadata": {
    "return_id": "abc123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "tax_liability": 8500,
    "effective_rate": 0.113
  },
  "processing_time_ms": 1250
}
```

### Specialized Endpoints

#### Document Analysis

**POST** `/api/cloud-agent/analyze-document`

Analyze a tax document and extract relevant information.

**Request:**
```json
{
  "document": "W-2 form data...",
  "documentType": "w2"
}
```

#### Tax Calculation

**POST** `/api/cloud-agent/calculate-tax`

Perform complex tax calculations.

**Request:**
```json
{
  "taxData": {
    "filing_status": "single",
    "income": 75000,
    "deductions": 12000
  }
}
```

#### Form Validation

**POST** `/api/cloud-agent/validate-form`

Validate a tax form for completeness and accuracy.

**Request:**
```json
{
  "formType": "1040",
  "formData": {
    "ssn": "***-**-****",
    "income": 75000
  }
}
```

#### Compliance Check

**POST** `/api/cloud-agent/check-compliance`

Check if a tax return meets IRS compliance requirements.

**Request:**
```json
{
  "returnData": {
    "year": 2024,
    "filing_status": "single",
    "forms": ["1040", "Schedule C"]
  }
}
```

## Task Types

The following task types are supported:

- `tax_calculation` - Complex tax liability calculations
- `document_analysis` - Extract information from documents
- `compliance_check` - Verify IRS compliance
- `form_validation` - Validate form completeness
- `data_extraction` - Extract specific data from unstructured text
- `custom` - Custom tasks with free-form prompts

## Authentication & Authorization

All cloud agent endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

### Required Permissions

- `/api/cloud-agent/delegate` - Requires `returns.read`
- `/api/cloud-agent/analyze-document` - Requires `documents.read`
- `/api/cloud-agent/calculate-tax` - Requires `returns.read`
- `/api/cloud-agent/validate-form` - Requires `returns.read`
- `/api/cloud-agent/check-compliance` - Requires `returns.read`

## Audit Logging

All cloud agent interactions are logged in the audit trail:

- `cloud_agent.delegate` - Task delegation initiated
- `cloud_agent.complete` - Task completed successfully
- `cloud_agent.error` - Task failed with error

## Error Handling

### Configuration Error

If `MCP_SERVER_URL` is not configured:

```json
{
  "error": "Cloud agent not configured",
  "message": "MCP_SERVER_URL environment variable is not set"
}
```

HTTP Status: **503 Service Unavailable**

### Validation Error

If required fields are missing:

```json
{
  "error": "Invalid request",
  "message": "task_type and prompt are required"
}
```

HTTP Status: **400 Bad Request**

### Processing Error

If the cloud agent fails to process the task:

```json
{
  "success": false,
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "error": "MCP server responded with 500: Internal server error",
  "processing_time_ms": 5000
}
```

HTTP Status: **500 Internal Server Error**

## Usage Example

```javascript
// Example: Validate a tax form before submission

const response = await fetch('/api/cloud-agent/validate-form', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    formType: '1040',
    formData: {
      filing_status: 'single',
      income: 75000,
      deductions: 12000,
      tax_withheld: 9000,
    },
  }),
});

const result = await response.json();

if (result.success) {
  console.log('Validation result:', result.result);
} else {
  console.error('Validation failed:', result.error);
}
```

## MCP Server Setup

To use cloud agent functionality, you need an MCP-compatible server. Options include:

1. **Claude API with MCP** - Anthropic's Claude with MCP support
2. **Custom MCP Server** - Self-hosted MCP server
3. **Third-party MCP Providers** - Managed MCP services

Ensure your MCP server endpoint is accessible from Cloudflare Workers and responds to the MCP protocol format.

## Security Considerations

1. **API Keys** - Store MCP server API keys securely in Cloudflare secrets
2. **Data Privacy** - Ensure sensitive data (SSN, etc.) is encrypted before sending to MCP
3. **Rate Limiting** - Implement rate limiting to prevent abuse
4. **Audit Logging** - All MCP requests are logged for compliance
5. **Timeout Protection** - Requests automatically timeout after 30 seconds

## Performance

- Default timeout: 30 seconds
- Automatic retry: 2 attempts with exponential backoff
- Average response time: 1-5 seconds depending on task complexity
- Maximum concurrent requests: Limited by Cloudflare Workers limits

## Future Enhancements

- [ ] Asynchronous task processing with webhooks
- [ ] Task result caching
- [ ] Multi-step agent workflows
- [ ] Custom agent tools integration
- [ ] Batch processing support
