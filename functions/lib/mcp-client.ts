/**
 * MCP (Model Context Protocol) Client
 * 
 * Client library for delegating tasks to cloud agents via MCP server
 */

import type { MCPRequest, MCPMessage, CloudAgentTaskType } from '../../types';

// Configuration constants
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;
const BACKOFF_BASE_MS = 1000; // Base delay for exponential backoff
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.3; // Lower temperature for more deterministic results

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
    this.timeout = config.timeout || DEFAULT_TIMEOUT_MS;
    this.retries = config.retries || DEFAULT_RETRIES;
  }

  /**
   * Send a request to the MCP server
   */
  async sendRequest(request: MCPRequest): Promise<any> {
    let lastError: Error | null = null;
    const totalAttempts = this.retries + 1; // Initial attempt + retries

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
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
        
        // Don't retry on the last attempt
        if (attempt === totalAttempts - 1) {
          break;
        }

        // Wait before retrying with exponential backoff
        // After initial attempt fails (attempt 0): wait 2^0 * 1s = 1s before retry 1
        // After retry 1 fails (attempt 1): wait 2^1 * 1s = 2s before retry 2
        // Pattern continues exponentially if more retries configured
        const delayMs = Math.pow(2, attempt) * BACKOFF_BASE_MS;
        await new Promise(resolve => setTimeout(resolve, delayMs));
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
      max_tokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
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
    timeout: DEFAULT_TIMEOUT_MS,
    retries: DEFAULT_RETRIES,
  });
}
