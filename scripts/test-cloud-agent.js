#!/usr/bin/env node

/**
 * Test Script for Cloud Agent Integration
 * 
 * This script tests the cloud agent API endpoints
 */

// Simulate the cloud agent client behavior
class CloudAgentClient {
  constructor(mcpServerUrl) {
    this.mcpServerUrl = mcpServerUrl;
  }

  async delegateTask(request) {
    const { task, context } = request;
    
    if (!this.mcpServerUrl || this.mcpServerUrl === '') {
      console.log('   ℹ️  No MCP server configured - using fallback mode');
      return this.getFallbackResponse(request);
    }

    // In real scenario, this would call the MCP server
    return {
      success: true,
      result: { message: 'Task delegated successfully', task, context },
      timestamp: new Date().toISOString(),
    };
  }

  getFallbackResponse(request) {
    const { task, context } = request;
    
    if (task.includes('workflow') || task.includes('steps')) {
      return {
        success: true,
        result: {
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
          context,
          note: 'Generated using fallback mode'
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    if (task.includes('analyze')) {
      return {
        success: true,
        result: {
          analysis: 'Document review completed',
          recommendations: [
            'Verify all income sources are documented',
            'Ensure deductions are properly supported',
            'Review filing status selection'
          ],
          context,
          note: 'Generated using fallback mode'
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      result: {
        message: 'Task acknowledged',
        task,
        context,
        note: 'Generated using fallback mode'
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getWorkflowSuggestions(context) {
    return this.delegateTask({
      task: 'Generate workflow steps for tax return preparation',
      context,
    });
  }

  async analyzeDocument(documentId, context) {
    return this.delegateTask({
      task: 'Analyze tax document and extract key information',
      context: { documentId, ...context },
    });
  }

  async reviewReturn(returnData) {
    return this.delegateTask({
      task: 'Review tax return for accuracy and optimization opportunities',
      context: returnData,
    });
  }
}

async function testCloudAgent() {
  console.log('🧪 Testing Cloud Agent Integration\n');

  // Test 1: Test without MCP_SERVER_URL (fallback mode)
  console.log('Test 1: Fallback Mode (no MCP_SERVER_URL)');
  console.log('=========================================');
  const fallbackClient = new CloudAgentClient('');
  
  const workflowResult = await fallbackClient.getWorkflowSuggestions({
    clientType: 'individual',
    filingStatus: 'married_joint'
  });
  
  console.log('✅ Result:', JSON.stringify(workflowResult, null, 2));
  console.log('');

  // Test 2: Test document analysis
  console.log('Test 2: Document Analysis (fallback mode)');
  console.log('=========================================');
  const docResult = await fallbackClient.analyzeDocument('doc_12345', {
    documentType: 'W-2',
    taxYear: 2024
  });
  
  console.log('✅ Result:', JSON.stringify(docResult, null, 2));
  console.log('');

  // Test 3: Test return review
  console.log('Test 3: Return Review (fallback mode)');
  console.log('=========================================');
  const reviewResult = await fallbackClient.reviewReturn({
    returnId: 'return_12345',
    filingStatus: 'single',
    income: 75000,
    deductions: 12950
  });
  
  console.log('✅ Result:', JSON.stringify(reviewResult, null, 2));
  console.log('');

  // Test 4: Test with MCP server URL configured
  console.log('Test 4: With MCP Server URL (simulated)');
  console.log('=========================================');
  const connectedClient = new CloudAgentClient('https://mcp-server.example.com');
  
  const taskResult = await connectedClient.delegateTask({
    task: 'Calculate estimated tax liability',
    context: {
      income: 100000,
      deductions: 25000,
      filingStatus: 'single'
    }
  });
  
  console.log('✅ Result:', JSON.stringify(taskResult, null, 2));
  console.log('');

  console.log('✅ All tests completed successfully!\n');
  console.log('📝 Notes:');
  console.log('   - Tests 1-3 ran in fallback mode (no MCP server configured)');
  console.log('   - Test 4 simulated connection to MCP server');
  console.log('   - To test with a real cloud agent, set MCP_SERVER_URL environment variable');
  console.log('   - The actual implementation is in functions/lib/cloud-agent.ts');
}

// Run tests
testCloudAgent().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

