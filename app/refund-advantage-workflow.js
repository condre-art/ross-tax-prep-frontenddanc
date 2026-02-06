// Refund Advantage Bank Product Workflow & API Schema
// Detailed workflow and task assignment for bank product integration

const refundAdvantageWorkflow = [
  'Collect taxpayer and bank product info',
  'Validate eligibility (ID, compliance, refund type)',
  'Submit application to Refund Advantage API',
  'Receive approval/denial',
  'Transmit efile with bank product info',
  'Track refund disbursement status',
  'Notify client and update dashboard',
  'Handle exceptions/errors',
  'Log compliance and audit events'
];

// Example API schema (simplified)
const refundAdvantageApiSchema = {
  endpoint: 'https://api.refund-advantage.com/v1/applications',
  method: 'POST',
  requiredFields: [
    'taxpayerName', 'ssn', 'dob', 'address', 'bankAccount', 'refundType', 'efin', 'etin', 'eroName', 'eroEmail', 'eroPhone'
  ],
  response: {
    status: 'approved | denied',
    applicationId: 'string',
    message: 'string',
    errors: 'array'
  }
};

// Example: Assign workflow tasks per role
const refundAdvantageTasks = {
  admin: ['Oversee all steps', 'Review compliance', 'Approve/deny applications'],
  ero: ['Submit application', 'Transmit efile', 'Track status'],
  staff: ['Collect info', 'Assist client', 'Upload docs'],
  client: ['Provide info', 'Sign disclosures']
};

export { refundAdvantageWorkflow, refundAdvantageApiSchema, refundAdvantageTasks };
