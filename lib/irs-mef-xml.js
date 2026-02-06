/**
 * IRS MEF XML Serialization/Deserialization Utilities
 * 
 * Handles conversion between JavaScript objects and IRS-compliant XML format
 * following the MEF schema specifications.
 * 
 * References:
 * - IRS MEF XML Schema: https://www.irs.gov/e-file-providers/schema-and-business-rules
 * - IRS Publication 4164: MEF XML Specifications
 */

import { MEF_SCHEMA_VERSION } from './irs-mef-schema.js';

/**
 * Generates a unique transmission ID
 * @returns {string} Transmission ID in format YYYYMMDDHHMMSSXXX
 */
export function generateTransmissionId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

/**
 * Generates a unique submission ID
 * @returns {string} 15-20 digit submission ID
 */
export function generateSubmissionId() {
  const timestamp = Date.now().toString();
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return timestamp + random;
}

/**
 * Calculates SHA-256 checksum for data
 * @param {string} data - Data to checksum
 * @returns {Promise<string>} Hex-encoded checksum
 */
export async function calculateChecksum(data) {
  // In browser environment
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto API
  // In production, this should use a proper crypto library
  return 'CHECKSUM_PLACEHOLDER_' + data.length;
}

/**
 * Escapes XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Serializes return data to IRS MEF XML format
 * @param {Object} returnData - Return data object
 * @param {Object} transmissionData - Transmission metadata
 * @returns {Promise<string>} XML string
 */
export async function serializeToMEFXML(returnData, transmissionData) {
  const transmissionId = transmissionData.transmissionId || generateTransmissionId();
  const submissionId = transmissionData.submissionId || generateSubmissionId();
  const timestamp = new Date().toISOString();
  const testIndicator = transmissionData.testIndicator || 'T';
  
  // Build return XML content
  const returnXML = buildReturnXML(returnData);
  
  // Calculate checksum
  const checksum = await calculateChecksum(returnXML);
  
  // Build MEF envelope
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Submission xmlns="http://www.irs.gov/efile" 
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.irs.gov/efile">
  <SubmissionManifest>
    <SubmissionId>${escapeXml(submissionId)}</SubmissionId>
    <TransmissionId>${escapeXml(transmissionId)}</TransmissionId>
    <Timestamp>${escapeXml(timestamp)}</Timestamp>
    <TestIndicator>${escapeXml(testIndicator)}</TestIndicator>
    <SchemaVersion>${escapeXml(MEF_SCHEMA_VERSION)}</SchemaVersion>
    <ChecksumAlgorithm>SHA-256</ChecksumAlgorithm>
    <Checksum>${escapeXml(checksum)}</Checksum>
  </SubmissionManifest>
  <SubmissionData>
    ${returnXML}
  </SubmissionData>
</Submission>`;
  
  return xml;
}

/**
 * Builds the return XML content for Form 1040
 * @param {Object} returnData - Return data
 * @returns {string} Return XML content
 */
function buildReturnXML(returnData) {
  return `<ReturnData documentCount="1">
  <Return returnVersion="${escapeXml(MEF_SCHEMA_VERSION)}">
    <ReturnHeader>
      <Timestamp>${new Date().toISOString()}</Timestamp>
      <TaxYear>${escapeXml(returnData.taxYear || new Date().getFullYear() - 1)}</TaxYear>
      <TaxPeriodBeginDate>${escapeXml(returnData.taxYear || new Date().getFullYear() - 1)}-01-01</TaxPeriodBeginDate>
      <TaxPeriodEndDate>${escapeXml(returnData.taxYear || new Date().getFullYear() - 1)}-12-31</TaxPeriodEndDate>
      <SoftwareId>${escapeXml(returnData.softwareId || 'ROSS-TAX-PREP-V1')}</SoftwareId>
      ${buildFilerInfo(returnData)}
      ${buildPreparerInfo(returnData)}
    </ReturnHeader>
    <ReturnData>
      <IRS1040 documentId="IRS1040">
        ${build1040Content(returnData)}
      </IRS1040>
    </ReturnData>
  </Return>
</ReturnData>`;
}

/**
 * Builds filer information XML
 * @param {Object} returnData - Return data
 * @returns {string} Filer info XML
 */
function buildFilerInfo(returnData) {
  return `<Filer>
    <Primary>
      <TaxpayerName>
        <FirstName>${escapeXml(returnData.taxpayerFirstName || '')}</FirstName>
        <LastName>${escapeXml(returnData.taxpayerLastName || '')}</LastName>
      </TaxpayerName>
      <TaxpayerSSN>${escapeXml(returnData.taxpayerSSN || '')}</TaxpayerSSN>
    </Primary>
    ${returnData.spouseSSN ? `<Secondary>
      <TaxpayerName>
        <FirstName>${escapeXml(returnData.spouseFirstName || '')}</FirstName>
        <LastName>${escapeXml(returnData.spouseLastName || '')}</LastName>
      </TaxpayerName>
      <TaxpayerSSN>${escapeXml(returnData.spouseSSN)}</TaxpayerSSN>
    </Secondary>` : ''}
  </Filer>`;
}

/**
 * Builds preparer information XML
 * @param {Object} returnData - Return data
 * @returns {string} Preparer info XML
 */
function buildPreparerInfo(returnData) {
  if (!returnData.preparerInfo) return '';
  
  const preparer = returnData.preparerInfo;
  return `<PreparerFirm>
    <PreparerName>${escapeXml(preparer.name || '')}</PreparerName>
    ${preparer.ptin ? `<PTIN>${escapeXml(preparer.ptin)}</PTIN>` : ''}
    ${preparer.efin ? `<EFIN>${escapeXml(preparer.efin)}</EFIN>` : ''}
    ${preparer.etin ? `<ETIN>${escapeXml(preparer.etin)}</ETIN>` : ''}
  </PreparerFirm>`;
}

/**
 * Builds Form 1040 content XML
 * @param {Object} returnData - Return data
 * @returns {string} 1040 content XML
 */
function build1040Content(returnData) {
  return `<FilingStatus>${escapeXml(returnData.filingStatus || 'Single')}</FilingStatus>
    <TotalIncome>${escapeXml(returnData.totalIncome || 0)}</TotalIncome>
    <AdjustedGrossIncome>${escapeXml(returnData.agi || 0)}</AdjustedGrossIncome>
    <TaxableIncome>${escapeXml(returnData.taxableIncome || 0)}</TaxableIncome>
    <TotalTax>${escapeXml(returnData.totalTax || 0)}</TotalTax>
    <TotalPayments>${escapeXml(returnData.totalPayments || 0)}</TotalPayments>
    <RefundAmount>${escapeXml(returnData.refundAmount || 0)}</RefundAmount>
    <AmountOwed>${escapeXml(returnData.amountOwed || 0)}</AmountOwed>`;
}

/**
 * Parses IRS acknowledgment XML response
 * @param {string} xmlString - XML response from IRS
 * @returns {Object} Parsed acknowledgment data
 */
export function parseAcknowledgment(xmlString) {
  try {
    // Simple XML parsing for browser environment
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      return {
        error: 'XML parse error',
        message: parseError.textContent
      };
    }
    
    // Extract acknowledgment data
    const ackCode = xmlDoc.querySelector('AcknowledgmentCode')?.textContent || '';
    const ackTimestamp = xmlDoc.querySelector('AcknowledgmentTimestamp')?.textContent || '';
    const submissionId = xmlDoc.querySelector('SubmissionId')?.textContent || '';
    const errors = Array.from(xmlDoc.querySelectorAll('Error')).map(err => ({
      code: err.querySelector('ErrorCode')?.textContent || '',
      message: err.querySelector('ErrorMessage')?.textContent || '',
      xpath: err.querySelector('XPath')?.textContent || ''
    }));
    
    return {
      acknowledgmentCode: ackCode,
      timestamp: ackTimestamp,
      submissionId,
      errors
    };
  } catch (err) {
    return {
      error: 'Failed to parse acknowledgment',
      message: err.message
    };
  }
}
