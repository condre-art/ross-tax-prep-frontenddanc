/**
 * Cloud Agent Client
 * 
 * Handles communication with cloud-based AI agent via Model Context Protocol (MCP)
 */

export interface AgentRequest {
  task: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: string;
}

export class CloudAgentClient {
  private mcpServerUrl: string;

  constructor(mcpServerUrl: string) {
    this.mcpServerUrl = mcpServerUrl;
  }

  /**
   * Delegate a task to the cloud agent
   */
  async delegateTask(request: AgentRequest): Promise<AgentResponse> {
    try {
      // If no MCP server URL is configured, return a fallback response
      if (!this.mcpServerUrl || this.mcpServerUrl === '') {
        console.warn('MCP_SERVER_URL not configured, using fallback mode');
        return this.getFallbackResponse(request);
      }

      // Make request to MCP server
      const response = await fetch(`${this.mcpServerUrl}/api/delegate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: request.task,
          context: request.context || {},
          metadata: request.metadata || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`MCP server responded with status ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        result: data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error delegating task to cloud agent:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to delegate task to cloud agent',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Fallback response when MCP server is not configured
   */
  private getFallbackResponse(request: AgentRequest): AgentResponse {
    // Generate intelligent fallback based on task type
    let result: any;

    if (request.task.includes('workflow') || request.task.includes('steps')) {
      result = {
        workflow: [
          'Collect client documents',
          'Review tax situation',
          'Assign preparer',
          'Prepare return',
          'Client review',
          'E-file submission',
          'Track refund',
          'Follow-up compliance'
        ],
        context: request.context,
        note: 'Generated using fallback mode - configure MCP_SERVER_URL for AI-powered responses'
      };
    } else if (request.task.includes('analyze') || request.task.includes('review')) {
      result = {
        analysis: 'Document review completed',
        recommendations: [
          'Verify all income sources are documented',
          'Ensure deductions are properly supported',
          'Review filing status selection'
        ],
        context: request.context,
        note: 'Generated using fallback mode - configure MCP_SERVER_URL for AI-powered responses'
      };
    } else {
      result = {
        message: 'Task acknowledged',
        task: request.task,
        context: request.context,
        note: 'Generated using fallback mode - configure MCP_SERVER_URL for AI-powered responses'
      };
    }

    return {
      success: true,
      result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get workflow suggestions from cloud agent
   */
  async getWorkflowSuggestions(context: Record<string, any>): Promise<AgentResponse> {
    return this.delegateTask({
      task: 'Generate workflow steps for tax return preparation',
      context,
      metadata: {
        requestType: 'workflow_generation',
      },
    });
  }

  /**
   * Analyze a document using cloud agent
   */
  async analyzeDocument(documentId: string, context: Record<string, any>): Promise<AgentResponse> {
    return this.delegateTask({
      task: 'Analyze tax document and extract key information',
      context: {
        documentId,
        ...context,
      },
      metadata: {
        requestType: 'document_analysis',
      },
    });
  }

  /**
   * Get return review suggestions from cloud agent
   */
  async reviewReturn(returnData: Record<string, any>): Promise<AgentResponse> {
    return this.delegateTask({
      task: 'Review tax return for accuracy and optimization opportunities',
      context: returnData,
      metadata: {
        requestType: 'return_review',
      },
    });
  }
}

/**
 * Factory function to create CloudAgentClient instance
 */
export function createCloudAgentClient(mcpServerUrl?: string): CloudAgentClient {
  return new CloudAgentClient(mcpServerUrl || '');
}
