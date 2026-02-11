# Cloud Integration Configuration

## MCP Server URL Configuration

The Ross Tax Prep frontend application supports integration with cloud monitoring and control plane (MCP) services for enhanced observability and error tracking.

### Configuration

The `MCP_SERVER_URL` binding is configured in `package.json` and `wrangler.toml` to enable cloud integration.

#### package.json Configuration

```json
"cloudflare": {
  "bindings": {
    "MCP_SERVER_URL": {
      "description": "Base URL of your deployed MCP server endpoint."
    }
  }
}
```

#### Setting the MCP Server URL

**For Cloudflare Workers/Pages:**

1. Set the binding value in your Cloudflare dashboard:
   - Navigate to Workers & Pages > Your Project > Settings > Variables
   - Add a new environment variable: `MCP_SERVER_URL`
   - Value: `https://your-mcp-server.example.com`

2. Or use Wrangler CLI:
   ```bash
   wrangler secret put MCP_SERVER_URL
   # Enter your MCP server URL when prompted
   ```

**For local development:**

Create a `.dev.vars` file in the project root:
```
MCP_SERVER_URL=http://localhost:3001
```

### Features

When `MCP_SERVER_URL` is configured, the application will:

1. **Critical Error Forwarding**: Automatically forward critical client-side errors to the MCP server for alerting and monitoring
2. **Audit Trail Integration**: Send high-severity audit events to the cloud monitoring service
3. **Real-time Alerts**: Enable real-time alerting for security and system events

### MCP Server API Endpoints

Your MCP server should expose the following endpoints:

#### POST /alerts
Receives critical alerts from the frontend application.

**Request Body:**
```json
{
  "type": "client_error",
  "severity": "critical",
  "message": "Error description",
  "context": "authentication|workflow|task|api",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "alert_id": "alert_xxx"
}
```

### Client-Side Error Logging

The application includes a comprehensive client-side error logging system in `/lib/client-logger.js` that:

1. **Logs errors locally** in localStorage as fallback
2. **Sends errors to backend** via `/api/logs/client`
3. **Forwards critical errors** to MCP server when configured

#### Usage Example

```javascript
import { logAuthError, logTaskError, logWorkflowError } from '../lib/client-logger.js';

// Log authentication errors
await logAuthError('login', error, { email, statusCode: 401 });

// Log task errors
await logTaskError('update', error, { taskId: 'task_123' });

// Log workflow errors
await logWorkflowError('transition', error, { workflowId: 'wf_456' });
```

### Backend Audit Logging

The backend API endpoint `/api/logs/client` (in `/functions/api/client-logs.ts`) receives client-side logs and:

1. Stores them in the `audit_logs` database table
2. Maps log levels to audit severity levels
3. Forwards critical logs to MCP server when configured
4. Captures IP address, user agent, and session information

### Security Considerations

1. **Authentication**: The client logging endpoint accepts Bearer tokens for authentication
2. **Rate Limiting**: Consider implementing rate limiting on the logging endpoint
3. **PII Protection**: Avoid logging sensitive personal information (passwords, SSNs, etc.)
4. **Log Retention**: Configure appropriate log retention policies in your database

### Monitoring Best Practices

1. **Regular Review**: Review error logs regularly for patterns and issues
2. **Alert Configuration**: Configure alerts for critical error rates
3. **Performance Impact**: Client logging is designed to be non-blocking and won't impact user experience
4. **Fallback Strategy**: Local storage serves as fallback when backend is unavailable

### Troubleshooting

**Issue**: Logs not appearing in MCP server
- Verify `MCP_SERVER_URL` is correctly set
- Check MCP server is accessible from Cloudflare Workers
- Review browser console for connection errors

**Issue**: High volume of duplicate logs
- Check for retry logic in error handling
- Verify error handlers are not in loops
- Review rate limiting configuration

**Issue**: Missing context in logs
- Ensure error details are passed to logging functions
- Check that session/user information is available
- Verify error objects contain stack traces

### Related Files

- `/lib/client-logger.js` - Client-side error logging utility
- `/functions/api/client-logs.ts` - Backend logging API endpoint
- `/functions/lib/auth.ts` - Backend audit logging service
- `/functions/api/workflows.ts` - Workflow system with built-in audit logging
- `/portal/login.html` - Authentication with error logging
- `/scripts/dashboard-widgets.js` - Dashboard with error logging

### Additional Resources

- [Cloudflare Workers Bindings Documentation](https://developers.cloudflare.com/workers/configuration/bindings/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [Workers Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
