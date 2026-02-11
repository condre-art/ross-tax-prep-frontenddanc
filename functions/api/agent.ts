/**
 * Cloud Agent API Endpoints
 * 
 * Handles delegation of tasks to cloud-based AI agent
 */

import { createCloudAgentClient, AgentRequest } from '../lib/cloud-agent';
import { generateId } from '../lib/auth';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  MCP_SERVER_URL?: string;
}

/**
 * POST /api/agent/delegate
 * Delegate a task to the cloud agent
 */
export async function delegateToAgent(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as AgentRequest;
    const { task, context, metadata } = body;

    // Validate required fields
    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: task' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create cloud agent client
    const agentClient = createCloudAgentClient(env.MCP_SERVER_URL);

    // Delegate task to cloud agent
    const agentResponse = await agentClient.delegateTask({
      task,
      context: {
        ...context,
        userId: user.id,
        userRole: user.role,
      },
      metadata,
    });

    // Log delegation in audit logs
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, severity)
       VALUES (?, ?, 'agent_delegation', 'agent', ?, ?, 'info')`
    )
      .bind(
        generateId(),
        user.id,
        task,
        JSON.stringify({
          task,
          success: agentResponse.success,
          hasResult: !!agentResponse.result,
        })
      )
      .run();

    return new Response(
      JSON.stringify({
        success: agentResponse.success,
        result: agentResponse.result,
        error: agentResponse.error,
        timestamp: agentResponse.timestamp,
      }),
      {
        status: agentResponse.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error delegating to cloud agent:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delegate to cloud agent', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/agent/workflow-suggestions
 * Get workflow suggestions from cloud agent
 */
export async function getWorkflowSuggestions(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as { context: Record<string, any> };
    const { context } = body;

    // Create cloud agent client
    const agentClient = createCloudAgentClient(env.MCP_SERVER_URL);

    // Get workflow suggestions
    const agentResponse = await agentClient.getWorkflowSuggestions({
      ...context,
      userId: user.id,
      userRole: user.role,
    });

    // Log in audit logs
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, severity)
       VALUES (?, ?, 'workflow_suggestions_requested', 'agent', ?, ?, 'info')`
    )
      .bind(
        generateId(),
        user.id,
        'workflow_suggestions',
        JSON.stringify({
          success: agentResponse.success,
          hasResult: !!agentResponse.result,
        })
      )
      .run();

    return new Response(
      JSON.stringify({
        success: agentResponse.success,
        workflow: agentResponse.result?.workflow || [],
        context: agentResponse.result?.context,
        note: agentResponse.result?.note,
        error: agentResponse.error,
        timestamp: agentResponse.timestamp,
      }),
      {
        status: agentResponse.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error getting workflow suggestions:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get workflow suggestions', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/agent/analyze-document
 * Analyze a document using cloud agent
 */
export async function analyzeDocument(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as { documentId: string; context?: Record<string, any> };
    const { documentId, context } = body;

    // Validate required fields
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: documentId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create cloud agent client
    const agentClient = createCloudAgentClient(env.MCP_SERVER_URL);

    // Analyze document
    const agentResponse = await agentClient.analyzeDocument(documentId, {
      ...context,
      userId: user.id,
      userRole: user.role,
    });

    // Log in audit logs
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, severity)
       VALUES (?, ?, 'document_analysis_requested', 'document', ?, ?, 'info')`
    )
      .bind(
        generateId(),
        user.id,
        documentId,
        JSON.stringify({
          success: agentResponse.success,
          hasResult: !!agentResponse.result,
        })
      )
      .run();

    return new Response(
      JSON.stringify({
        success: agentResponse.success,
        analysis: agentResponse.result,
        error: agentResponse.error,
        timestamp: agentResponse.timestamp,
      }),
      {
        status: agentResponse.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error analyzing document:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze document', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/agent/review-return
 * Review a tax return using cloud agent
 */
export async function reviewReturn(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as { returnId: string; returnData: Record<string, any> };
    const { returnId, returnData } = body;

    // Validate required fields
    if (!returnId || !returnData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: returnId, returnData' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create cloud agent client
    const agentClient = createCloudAgentClient(env.MCP_SERVER_URL);

    // Review return
    const agentResponse = await agentClient.reviewReturn({
      ...returnData,
      returnId,
      userId: user.id,
      userRole: user.role,
    });

    // Log in audit logs
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, severity)
       VALUES (?, ?, 'return_review_requested', 'tax_return', ?, ?, 'info')`
    )
      .bind(
        generateId(),
        user.id,
        returnId,
        JSON.stringify({
          success: agentResponse.success,
          hasResult: !!agentResponse.result,
        })
      )
      .run();

    return new Response(
      JSON.stringify({
        success: agentResponse.success,
        review: agentResponse.result,
        error: agentResponse.error,
        timestamp: agentResponse.timestamp,
      }),
      {
        status: agentResponse.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error reviewing return:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to review return', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
