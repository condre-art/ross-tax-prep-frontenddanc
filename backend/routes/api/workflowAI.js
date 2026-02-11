const express = require('express');
const router = express.Router();

// POST /api/workflow-ai
router.post('/', async (req, res) => {
  try {
    const { context } = req.body;
    
    // Try to delegate to cloud agent if MCP_SERVER_URL is configured
    const mcpServerUrl = process.env.MCP_SERVER_URL;
    
    if (mcpServerUrl) {
      try {
        const response = await fetch(`${mcpServerUrl}/api/delegate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task: 'Generate workflow steps for tax return preparation',
            context,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json({
            workflow: data.workflow || data.result?.workflow || [],
            context: context,
            source: 'cloud_agent',
          });
        }
      } catch (error) {
        console.warn('Failed to connect to cloud agent, using fallback:', error.message);
      }
    }
    
    // Fallback to static workflow suggestion
    res.json({
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
      source: 'fallback',
      note: 'Configure MCP_SERVER_URL environment variable for AI-powered workflow suggestions'
    });
  } catch (error) {
    console.error('Error in workflow-ai endpoint:', error);
    res.status(500).json({
      error: 'Failed to generate workflow suggestions',
      details: error.message,
    });
  }
});

module.exports = router;
