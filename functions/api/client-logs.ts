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
      // Token validation would happen here in production
      // For now, we'll accept the session ID from the log entry
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

    // If MCP_SERVER_URL is configured, forward critical logs
    if (env.MCP_SERVER_URL && severity === 'critical') {
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
        // Log forwarding failure but don't fail the request
        console.error('Failed to forward critical log to MCP server:', err);
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
