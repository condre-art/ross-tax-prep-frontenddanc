// Bookkeeping Tools Scaffold
// Supports C-Corp, S-Corp, LLC, Trust, Self-Employed

const entityTypes = [
  'ccorp', 'scorp', 'llc', 'trust', 'selfemployed'
];

const bookkeepingFeatures = {
  ccorp: ['General Ledger', 'Payroll', 'Tax Filing', 'Compliance'],
  scorp: ['General Ledger', 'Payroll', 'Tax Filing', 'Shareholder Management'],
  llc: ['General Ledger', 'Tax Filing', 'Member Management'],
  trust: ['General Ledger', 'Tax Filing', 'Trustee Management'],
  selfemployed: ['Income Tracking', 'Expense Tracking', 'Tax Filing']
};

function getBookkeepingFeatures(entityType) {
  return bookkeepingFeatures[entityType] || [];
}

export { entityTypes, bookkeepingFeatures, getBookkeepingFeatures };
