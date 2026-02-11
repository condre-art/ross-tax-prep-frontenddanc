/**
 * Cloud Agent API
 * 
 * Endpoints for delegating tasks to cloud agents via MCP
 */

import { createMCPClient } from '../lib/mcp-client';
import { AuditService, getClientIP, getUserAgent } from '../lib/auth';
import type {
  CloudAgentRequest,
  CloudAgentResponse,
  CloudAgentTaskType,
  CloudAgentStatus,
  Env,
} from '../../types';

/**
 * Delegate a task to the cloud agent
 */
export async function delegateToCloudAgent(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  const startTime = Date.now();

  try {
    // Check if MCP is configured
    if (!env.MCP_SERVER_URL) {
      return new Response(
        JSON.stringify({
          error: 'Cloud agent not configured',
          message: 'MCP_SERVER_URL environment variable is not set',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let body: CloudAgentRequest;
    
    try {
      body = await request.json() as CloudAgentRequest;
    } catch (jsonError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate request
    if (!body.task_type || !body.prompt) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'task_type and prompt are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Note: Permission check is done at middleware level
    // The general delegation endpoint requires 'returns.read' permission
    // which is appropriate since cloud agent tasks are primarily tax-related

    // Create MCP client
    const mcpClient = createMCPClient(env.MCP_SERVER_URL);

    if (!mcpClient) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create MCP client',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate task ID
    const taskId = crypto.randomUUID();

    // Log the delegation
    await AuditService.log(
      env.DB,
      user.id,
      'cloud_agent.delegate',
      'mcp_task',
      taskId,
      {
        task_type: body.task_type,
        has_context: !!body.context,
        has_metadata: !!body.metadata,
      },
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    // Delegate to cloud agent
    let result: any;
    let status: CloudAgentStatus = 'processing';

    try {
      result = await mcpClient.delegateTask(
        body.task_type,
        body.prompt,
        body.context
      );
      status = 'completed';
    } catch (error: any) {
      status = 'failed';
      
      // Log the error
      await AuditService.log(
        env.DB,
        user.id,
        'cloud_agent.error',
        'mcp_task',
        taskId,
        {
          error: error.message,
          task_type: body.task_type,
        },
        getClientIP(request),
        getUserAgent(request),
        'error'
      );

      const response: CloudAgentResponse = {
        success: false,
        task_id: taskId,
        status: 'failed',
        error: error.message,
        processing_time_ms: Date.now() - startTime,
      };

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log successful completion
    await AuditService.log(
      env.DB,
      user.id,
      'cloud_agent.complete',
      'mcp_task',
      taskId,
      {
        task_type: body.task_type,
        processing_time_ms: Date.now() - startTime,
      },
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    const response: CloudAgentResponse = {
      success: true,
      task_id: taskId,
      status,
      result,
      processing_time_ms: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Cloud agent delegation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get specialized task handlers
 */
export async function handleSpecializedTask(
  request: Request,
  env: Env,
  user: any,
  taskType: CloudAgentTaskType
): Promise<Response> {
  if (!env.MCP_SERVER_URL) {
    return new Response(
      JSON.stringify({
        error: 'Cloud agent not configured',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const mcpClient = createMCPClient(env.MCP_SERVER_URL);

  if (!mcpClient) {
    return new Response(
      JSON.stringify({
        error: 'Failed to create MCP client',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    let body: any;
    
    try {
      body = await request.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let result: any;

    switch (taskType) {
      case 'document_analysis':
        if (!body.document || !body.documentType) {
          return new Response(
            JSON.stringify({
              error: 'Invalid request',
              message: 'document and documentType are required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        result = await mcpClient.analyzeDocument(
          body.document,
          body.documentType
        );
        break;

      case 'tax_calculation':
        if (!body.taxData) {
          return new Response(
            JSON.stringify({
              error: 'Invalid request',
              message: 'taxData is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        result = await mcpClient.calculateTax(body.taxData);
        break;

      case 'form_validation':
        if (!body.formType || !body.formData) {
          return new Response(
            JSON.stringify({
              error: 'Invalid request',
              message: 'formType and formData are required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        result = await mcpClient.validateForm(
          body.formType,
          body.formData
        );
        break;

      case 'compliance_check':
        if (!body.returnData) {
          return new Response(
            JSON.stringify({
              error: 'Invalid request',
              message: 'returnData is required',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        result = await mcpClient.checkCompliance(body.returnData);
        break;

      default:
        return new Response(
          JSON.stringify({
            error: 'Unsupported task type',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
