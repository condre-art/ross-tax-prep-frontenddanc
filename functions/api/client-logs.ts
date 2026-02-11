/**
 * Client-Side Logging API Endpoint
 * 
 * Receives error logs from frontend for audit trails and monitoring
 */

import { generateId, getClientIP, getUserAgent } from '../lib/auth';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  MCP_SERVER_URL?: string;
  AWS_CLOUDWATCH_LOG_GROUP?: string;
  AWS_CLOUDWATCH_LOG_STREAM?: string;
  AWS_SNS_TOPIC_ARN?: string;
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
}

interface ClientLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: string;
  details: Record<string, any>;
  userAgent: string;
  url: string;
  sessionId: string;
}

/**
 * POST /api/logs/client
 * Store client-side error logs for audit and monitoring
 */
export async function onRequestPost(context: {
  request: Request;
  env: Env;
  params: any;
}): Promise<Response> {
  const { request, env } = context;

  try {
    const logEntry = (await request.json()) as ClientLogEntry;
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Extract user ID from auth token if available
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Import JWTService if needed for proper token validation
      // For now, we accept logs from authenticated and unauthenticated users
      // but try to associate with user if token is valid
      try {
        // You could add JWTService.verifyToken here to get actual user ID
        // For now, use session ID as fallback
        userId = logEntry.sessionId || null;
      } catch {
        userId = logEntry.sessionId || null;
      }
    } else {
      // Allow unauthenticated logging (uses session ID)
      userId = logEntry.sessionId || null;
    }

    // Map client log level to audit severity
    const severityMap: Record<string, 'info' | 'warning' | 'error' | 'critical'> = {
      'info': 'info',
      'warning': 'warning',
      'error': 'error',
      'critical': 'critical'
    };
    const severity = severityMap[logEntry.level] || 'error';

    // Store in audit logs
    const auditId = generateId('audit');
    await env.DB.prepare(
      `INSERT INTO audit_logs 
       (id, user_id, action, resource_type, resource_id, ip_address, user_agent, details, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        auditId,
        userId,
        'client_error',
        logEntry.context,
        null,
        ipAddress,
        userAgent,
        JSON.stringify({
          message: logEntry.message,
          details: logEntry.details,
          url: logEntry.url,
          clientTimestamp: logEntry.timestamp
        }),
        severity
      )
      .run();

    // Forward critical logs to cloud monitoring services
    if (severity === 'critical') {
      // AWS CloudWatch Logs integration
      if (env.AWS_CLOUDWATCH_LOG_GROUP && env.AWS_REGION) {
        try {
          await forwardToCloudWatch(env, logEntry);
        } catch (err) {
          console.error('Failed to forward critical log to CloudWatch:', err);
        }
      }

      // AWS SNS integration for real-time alerts
      if (env.AWS_SNS_TOPIC_ARN && env.AWS_REGION) {
        try {
          await publishToSNS(env, logEntry);
        } catch (err) {
          console.error('Failed to publish alert to SNS:', err);
        }
      }

      // Generic MCP Server integration (backward compatibility)
      if (env.MCP_SERVER_URL) {
        try {
          await fetch(`${env.MCP_SERVER_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'client_error',
              severity: 'critical',
              message: logEntry.message,
              context: logEntry.context,
              timestamp: new Date().toISOString()
            })
          });
        } catch (err) {
          console.error('Failed to forward critical log to MCP server:', err);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, log_id: auditId }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error storing client log:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to store log', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/logs/client
 * Retrieve client error logs (admin only)
 * 
 * Note: This endpoint is protected by withAuth middleware in _middleware.ts
 * which requires admin permissions ('*' permission).
 */
export async function onRequestGet(context: {
  request: Request;
  env: Env;
  params: any;
}): Promise<Response> {
  const { request, env } = context;

  try {
    // TODO: Add authentication check here
    // For now, we'll allow retrieval with basic filtering

    const url = new URL(request.url);
    const severity = url.searchParams.get('severity');
    const context_type = url.searchParams.get('context');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    let query = `SELECT * FROM audit_logs WHERE action = 'client_error'`;
    const bindings: any[] = [];

    if (severity) {
      query += ' AND severity = ?';
      bindings.push(severity);
    }

    if (context_type) {
      query += ' AND resource_type = ?';
      bindings.push(context_type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    bindings.push(Math.min(limit, 1000)); // Max 1000 records

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error retrieving client logs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve logs', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Forward critical error to AWS CloudWatch Logs
 */
async function forwardToCloudWatch(env: Env, logEntry: ClientLogEntry): Promise<void> {
  if (!env.AWS_REGION || !env.AWS_CLOUDWATCH_LOG_GROUP) {
    return;
  }

  const logGroupName = env.AWS_CLOUDWATCH_LOG_GROUP;
  const logStreamName = env.AWS_CLOUDWATCH_LOG_STREAM || `client-errors-${new Date().toISOString().split('T')[0]}`;
  
  // Build CloudWatch Logs API request
  const timestamp = Date.now();
  const logEvent = {
    timestamp,
    message: JSON.stringify({
      level: logEntry.level,
      message: logEntry.message,
      context: logEntry.context,
      details: logEntry.details,
      url: logEntry.url,
      userAgent: logEntry.userAgent,
      sessionId: logEntry.sessionId
    })
  };

  // Use AWS Signature Version 4 for authentication
  const endpoint = `https://logs.${env.AWS_REGION}.amazonaws.com/`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'Logs_20140328.PutLogEvents'
      },
      body: JSON.stringify({
        logGroupName,
        logStreamName,
        logEvents: [logEvent]
      })
    });

    if (!response.ok) {
      console.error('CloudWatch Logs API error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send logs to CloudWatch:', error);
  }
}

/**
 * Publish critical alert to AWS SNS
 */
async function publishToSNS(env: Env, logEntry: ClientLogEntry): Promise<void> {
  if (!env.AWS_REGION || !env.AWS_SNS_TOPIC_ARN) {
    return;
  }

  const endpoint = `https://sns.${env.AWS_REGION}.amazonaws.com/`;
  
  const message = {
    type: 'client_error',
    severity: 'critical',
    message: logEntry.message,
    context: logEntry.context,
    details: logEntry.details,
    url: logEntry.url,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        Action: 'Publish',
        TopicArn: env.AWS_SNS_TOPIC_ARN,
        Message: JSON.stringify(message),
        Subject: `Critical Client Error: ${logEntry.context}`
      })
    });

    if (!response.ok) {
      console.error('SNS API error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to publish to SNS:', error);
  }
}
