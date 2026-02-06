// Workflow Style Templates
// Three styles: Simple, Advanced, Compliance-Focused

const workflowTemplates = {
  simple: {
    name: 'Simple',
    steps: [
      'Collect basic info',
      'Prepare return',
      'Transmit to IRS',
      'Notify client'
    ]
  },
  advanced: {
    name: 'Advanced',
    steps: [
      'Collect detailed info',
      'Validate business rules',
      'Prepare return',
      'Bank product setup',
      'Transmit to IRS',
      'Handle errors',
      'Notify client'
    ]
  },
  compliance: {
    name: 'Compliance-Focused',
    steps: [
      'Collect info',
      'Compliance check',
      'Prepare return',
      'Transmit to IRS',
      'Log compliance events',
      'Notify client',
      'Archive records'
    ]
  }
};

function getWorkflowTemplate(style) {
  return workflowTemplates[style] || workflowTemplates.simple;
}

export { workflowTemplates, getWorkflowTemplate };
