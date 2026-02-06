/**
 * IRS MEF (Modernized e-File) Schema Validation Library
 * 
 * References:
 * - IRS MEF Schema: https://www.irs.gov/e-file-providers/modernized-e-file-mef-for-software-developers
 * - IRS Publication 4164: Modernized e-File (MeF) Guide for Software Developers and Transmitters
 * - IRS Publication 1345: Handbook for Authorized IRS e-file Providers of Individual Income Tax Returns
 * 
 * This library provides validation for IRS MEF XML schema compliance
 */

/**
 * MEF Schema Version supported
 */
export const MEF_SCHEMA_VERSION = '2024v5.0';

/**
 * Required MEF envelope elements
 */
export const MEF_ENVELOPE_REQUIREMENTS = {
  transmissionId: { required: true, pattern: /^[A-Z0-9]{8,20}$/ },
  timestamp: { required: true, format: 'ISO8601' },
  submissionId: { required: true, pattern: /^[0-9]{15,20}$/ },
  testIndicator: { required: true, values: ['T', 'P'] }, // T=Test, P=Production
  originalSubmissionId: { required: false },
  checksumAlgorithm: { required: true, values: ['SHA-256', 'SHA-512'] }
};

/**
 * Required return data elements for Form 1040
 */
export const MEF_1040_REQUIREMENTS = {
  taxYear: { required: true, pattern: /^20[0-9]{2}$/ },
  taxpayerSSN: { required: true, pattern: /^[0-9]{9}$/ },
  taxpayerName: { required: true },
  filingStatus: { required: true, values: ['Single', 'MarriedFilingJointly', 'MarriedFilingSeparately', 'HeadOfHousehold', 'QualifyingWidow'] },
  preparerInfo: { required: true },
  preparerPTIN: { required: false, pattern: /^P[0-9]{8}$/ },
  efileIndicator: { required: true, values: ['OnlineFiler', 'ERO'] },
  softwareId: { required: true }
};

/**
 * IRS acknowledgment codes
 */
export const IRS_ACK_CODES = {
  '0000': 'Accepted - Return transmitted successfully',
  '1000': 'Rejected - Business rule validation failed',
  '2000': 'Rejected - Schema validation failed',
  '3000': 'Rejected - Database validation failed',
  '5000': 'Accepted with Errors - Manual review required',
  '9999': 'System Error - Contact IRS e-Services'
};

/**
 * Validates transmission data against MEF requirements
 * @param {Object} transmissionData - The transmission data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateMEFTransmission(transmissionData) {
  const errors = [];
  
  // Validate envelope requirements
  for (const [field, rules] of Object.entries(MEF_ENVELOPE_REQUIREMENTS)) {
    if (rules.required && !transmissionData[field]) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }
    
    if (transmissionData[field]) {
      if (rules.pattern && !rules.pattern.test(transmissionData[field])) {
        errors.push(`Invalid format for ${field}: ${transmissionData[field]}`);
      }
      
      if (rules.values && !rules.values.includes(transmissionData[field])) {
        errors.push(`Invalid value for ${field}: ${transmissionData[field]}. Must be one of: ${rules.values.join(', ')}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates 1040 return data against MEF requirements
 * @param {Object} returnData - The 1040 return data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validate1040Return(returnData) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(MEF_1040_REQUIREMENTS)) {
    if (rules.required && !returnData[field]) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }
    
    if (returnData[field]) {
      if (rules.pattern && !rules.pattern.test(String(returnData[field]))) {
        errors.push(`Invalid format for ${field}: ${returnData[field]}`);
      }
      
      if (rules.values && !rules.values.includes(returnData[field])) {
        errors.push(`Invalid value for ${field}: ${returnData[field]}. Must be one of: ${rules.values.join(', ')}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gets human-readable message for IRS acknowledgment code
 * @param {string} ackCode - The IRS acknowledgment code
 * @returns {string} Human-readable message
 */
export function getAckMessage(ackCode) {
  return IRS_ACK_CODES[ackCode] || `Unknown acknowledgment code: ${ackCode}`;
}

/**
 * Determines if an acknowledgment code represents success
 * @param {string} ackCode - The IRS acknowledgment code
 * @returns {boolean} True if successful
 */
export function isAckSuccess(ackCode) {
  return ackCode === '0000' || ackCode === '5000';
}
