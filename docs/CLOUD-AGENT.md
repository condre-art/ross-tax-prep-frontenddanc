# Cloud Agent Integration Guide

## Overview

The Ross Tax Prep application integrates with cloud-based AI agents using the **Model Context Protocol (MCP)**. This allows the system to delegate complex tasks such as workflow generation, document analysis, and tax return reviews to intelligent cloud services.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Client/User    │────────▶│  Cloudflare      │────────▶│  MCP Server     │
│  Application    │         │  Workers/Pages   │         │  (Cloud Agent)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Cloud Agent     │
                            │  Client Module   │
                            └──────────────────┘
```

## Configuration

### 1. Set MCP Server URL

In your `wrangler.toml`:

```toml
[vars]
MCP_SERVER_URL = "https://your-mcp-server.example.com"
```

Or set as an environment variable in Cloudflare Pages dashboard:
- **Key**: `MCP_SERVER_URL`
- **Value**: Your MCP server endpoint URL

### 2. Fallback Mode

If `MCP_SERVER_URL` is not configured or the cloud agent is unavailable, the system automatically falls back to generating responses locally. This ensures the application remains functional even without a cloud agent connection.

## API Endpoints

### 1. General Task Delegation

**POST** `/api/agent/delegate`

Delegate any task to the cloud agent.

**Request:**
```json
{
  "task": "Generate workflow steps for tax return preparation",
  "context": {
    "clientType": "individual",
    "filingStatus": "married_joint"
  },
  "metadata": {
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "workflow": ["Step 1", "Step 2", ...],
    "context": {...}
  },
  "timestamp": "2026-02-11T05:17:48.437Z"
}
```

### 2. Workflow Suggestions

**POST** `/api/agent/workflow-suggestions`

Get AI-powered workflow suggestions for tax preparation.

**Request:**
```json
{
  "context": {
    "clientType": "individual",
    "returnType": "1040",
    "complexity": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "workflow": [
    "Collect client documents",
    "Review tax situation",
    "Assign preparer",
    "Prepare return",
    "Client review",
    "E-file submission",
    "Track refund",
    "Follow-up compliance"
  ],
  "context": {...},
  "timestamp": "2026-02-11T05:17:48.437Z"
}
```

### 3. Document Analysis

**POST** `/api/agent/analyze-document`

Analyze a tax document using AI.

**Request:**
```json
{
  "documentId": "doc_12345",
  "context": {
    "documentType": "W-2",
    "taxYear": 2024
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "documentType": "W-2",
    "extractedData": {...},
    "recommendations": [...]
  },
  "timestamp": "2026-02-11T05:17:48.437Z"
}
```

### 4. Tax Return Review

**POST** `/api/agent/review-return`

Get AI-powered review of a tax return.

**Request:**
```json
{
  "returnId": "return_12345",
  "returnData": {
    "filingStatus": "single",
    "income": {...},
    "deductions": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "review": {
    "status": "approved",
    "recommendations": [
      "Consider itemizing deductions",
      "Verify all income sources"
    ],
    "potentialIssues": []
  },
  "timestamp": "2026-02-11T05:17:48.437Z"
}
```

## Authentication & Authorization

All cloud agent endpoints require authentication via JWT token. Required permissions:

| Endpoint | Required Permission |
|----------|---------------------|
| `/api/agent/delegate` | `workflows.create` |
| `/api/agent/workflow-suggestions` | `workflows.read` |
| `/api/agent/analyze-document` | `documents.read` |
| `/api/agent/review-return` | `returns.read` |

## Error Handling

### Cloud Agent Unavailable

If the cloud agent is unavailable, the system automatically falls back to local processing:

```json
{
  "success": true,
  "result": {
    "workflow": [...],
    "note": "Generated using fallback mode - configure MCP_SERVER_URL for AI-powered responses"
  },
  "timestamp": "2026-02-11T05:17:48.437Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Failed to delegate task to cloud agent",
  "timestamp": "2026-02-11T05:17:48.437Z"
}
```

## Backend Integration

The Express backend also integrates with the cloud agent:

**POST** `/api/workflow-ai`

This endpoint automatically delegates to the cloud agent if `MCP_SERVER_URL` is configured, otherwise falls back to static workflow suggestions.

## Security

- All cloud agent requests include user context (userId, userRole)
- All delegations are logged in audit logs for compliance
- Cloud agent communication uses HTTPS
- Sensitive data should be encrypted before sending to cloud agent

## Testing

### Local Testing

1. Start the development server:
```bash
npm run pages:dev
```

2. Test with fallback mode (no MCP_SERVER_URL):
```bash
curl -X POST http://localhost:8787/api/agent/workflow-suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"context": {"clientType": "individual"}}'
```

### Production Testing

Set `MCP_SERVER_URL` and test with your actual cloud agent endpoint.

## Monitoring

All cloud agent interactions are logged in the `audit_logs` table with:
- Action type: `agent_delegation`, `workflow_suggestions_requested`, etc.
- User information
- Success/failure status
- Timestamp

Query audit logs:
```sql
SELECT * FROM audit_logs 
WHERE action LIKE '%agent%' 
ORDER BY created_at DESC 
LIMIT 100;
```

## Best Practices

1. **Always configure MCP_SERVER_URL in production** for optimal AI-powered functionality
2. **Monitor audit logs** to track cloud agent usage
3. **Implement rate limiting** on cloud agent endpoints if needed
4. **Cache frequent requests** to reduce cloud agent load
5. **Test fallback mode** regularly to ensure system resilience

## Troubleshooting

### Issue: Cloud agent not responding

**Solution**: Check `MCP_SERVER_URL` configuration and network connectivity. System will automatically fall back to local processing.

### Issue: Unauthorized errors

**Solution**: Ensure JWT token is valid and user has required permissions.

### Issue: Slow response times

**Solution**: Consider implementing caching for frequently requested data or use async processing for long-running tasks.
