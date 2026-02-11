/**
 * MCP (Model Context Protocol) Client
 * 
 * Client library for delegating tasks to cloud agents via MCP server
 */

import type { MCPRequest, MCPMessage, CloudAgentTaskType } from '../../types';

export interface MCPClientConfig {
  serverUrl: string;
  timeout?: number;
  retries?: number;
}

export class MCPClient {
  private serverUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: MCPClientConfig) {
    this.serverUrl = config.serverUrl;
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.retries = config.retries || 2;
  }

  /**
   * Send a request to the MCP server
   */
  async sendRequest(request: MCPRequest): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.serverUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`MCP server responded with ${response.status}: ${await response.text()}`);
        }

        return await response.json();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on abort/timeout for the last attempt
        if (attempt === this.retries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error('MCP request failed');
  }

  /**
   * Delegate a task to the cloud agent
   */
  async delegateTask(
    taskType: CloudAgentTaskType,
    prompt: string,
    context?: Record<string, any>
  ): Promise<any> {
    const messages: MCPMessage[] = [
      {
        role: 'user',
        content: this.buildPrompt(taskType, prompt, context),
      },
    ];

    const request: MCPRequest = {
      messages,
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more deterministic results
    };

    return this.sendRequest(request);
  }

  /**
   * Build a structured prompt for the cloud agent
   */
  private buildPrompt(
    taskType: CloudAgentTaskType,
    prompt: string,
    context?: Record<string, any>
  ): string {
    let fullPrompt = `Task Type: ${taskType}\n\n`;

    if (context) {
      fullPrompt += `Context:\n${JSON.stringify(context, null, 2)}\n\n`;
    }

    fullPrompt += `Request:\n${prompt}`;

    return fullPrompt;
  }

  /**
   * Analyze a tax document
   */
  async analyzeDocument(
    documentData: string,
    documentType: string
  ): Promise<any> {
    return this.delegateTask(
      'document_analysis',
      `Analyze the following ${documentType} document and extract relevant tax information.`,
      { document: documentData, documentType }
    );
  }

  /**
   * Perform tax calculation
   */
  async calculateTax(
    taxData: Record<string, any>
  ): Promise<any> {
    return this.delegateTask(
      'tax_calculation',
      'Calculate tax liability based on the provided information.',
      { taxData }
    );
  }

  /**
   * Validate tax form
   */
  async validateForm(
    formType: string,
    formData: Record<string, any>
  ): Promise<any> {
    return this.delegateTask(
      'form_validation',
      `Validate the ${formType} form for completeness and accuracy.`,
      { formType, formData }
    );
  }

  /**
   * Check compliance requirements
   */
  async checkCompliance(
    returnData: Record<string, any>
  ): Promise<any> {
    return this.delegateTask(
      'compliance_check',
      'Check if the tax return meets all IRS compliance requirements.',
      { returnData }
    );
  }
}

/**
 * Create an MCP client instance
 */
export function createMCPClient(serverUrl?: string): MCPClient | null {
  if (!serverUrl) {
    return null;
  }

  return new MCPClient({
    serverUrl,
    timeout: 30000,
    retries: 2,
  });
}
