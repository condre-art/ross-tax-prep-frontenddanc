# IRS MEF Schema Integration Documentation

## Overview

This implementation provides comprehensive integration with the IRS Modernized e-File (MEF) system for electronic tax return submission. The solution includes schema validation, XML envelope generation, error handling, and compliance logging.

## Features

### 1. MEF Schema Validation (`lib/irs-mef-schema.js`)

- **Schema Compliance**: Validates data against IRS MEF XML schema standards (version 2024v5.0)
- **Transmission Validation**: Ensures all required envelope elements are present and correctly formatted
- **Return Validation**: Validates Form 1040 data against MEF requirements
- **Acknowledgment Code Handling**: Interprets IRS acknowledgment codes and provides human-readable messages

#### Key Functions:

- `validateMEFTransmission(transmissionData)` - Validates transmission envelope data
- `validate1040Return(returnData)` - Validates Form 1040 return data
- `getAckMessage(ackCode)` - Returns human-readable acknowledgment message
- `isAckSuccess(ackCode)` - Determines if acknowledgment represents success

### 2. XML Serialization (`lib/irs-mef-xml.js`)

- **XML Generation**: Converts JavaScript objects to IRS-compliant XML format
- **Envelope Creation**: Generates proper MEF transmission envelopes
- **Checksum Calculation**: Implements SHA-256 checksums for data integrity
- **XML Parsing**: Parses IRS acknowledgment responses

#### Key Functions:

- `serializeToMEFXML(returnData, transmissionData)` - Generates complete MEF XML
- `parseAcknowledgment(xmlString)` - Parses IRS acknowledgment XML
- `generateTransmissionId()` - Creates unique transmission identifiers
- `generateSubmissionId()` - Creates unique submission identifiers
- `calculateChecksum(data)` - Computes SHA-256 checksums

### 3. Compliance Logging (`lib/irs-efile-logger.js`)

- **Comprehensive Logging**: Tracks all e-filing events for compliance
- **Event Types**: Validation, transmission, acknowledgment, errors, status checks
- **Persistent Storage**: Logs stored in localStorage and can be sent to backend
- **Export Capability**: Export logs as JSON for auditing

#### Key Functions:

- `logValidation(validationResult, returnId)` - Logs validation events
- `logTransmission(submissionId, returnId, transmissionData)` - Logs transmission attempts
- `logAcknowledgment(acknowledgment, returnId)` - Logs IRS acknowledgments
- `logError(error, context, returnId)` - Logs error events
- `logStatusCheck(submissionId, returnId, status)` - Logs status checks
- `exportLogs()` - Exports all logs as JSON

### 4. Enhanced UI (`admin/efile.html`)

- **MEF Information Panel**: Displays schema version and IRS resource links
- **Workflow Tracker**: Visual progress indicator for 5-step transmission process
- **Validation Preview**: Pre-transmission validation with detailed error reporting
- **Status Display**: Comprehensive transmission status with acknowledgment details
- **Compliance Log Viewer**: Real-time display of all logging events
- **Test Mode**: Toggle between test and production environments

## Workflow Steps

The e-file transmission follows a 5-step workflow:

1. **Validate MEF Schema Compliance** - Checks data against IRS schema requirements
2. **Generate IRS XML Envelope** - Creates MEF-compliant XML with checksums
3. **Create Transmission Record** - Initializes transmission in the system
4. **Submit to IRS** - Sends data to IRS e-file system
5. **Receive Acknowledgment** - Processes IRS response and updates status

## IRS MEF Requirements

### Required Transmission Elements

- **transmissionId**: 8-20 alphanumeric characters
- **timestamp**: ISO 8601 format
- **submissionId**: 15-20 digit identifier
- **testIndicator**: 'T' (Test) or 'P' (Production)
- **checksumAlgorithm**: SHA-256 or SHA-512

### Required Form 1040 Elements

- **taxYear**: 4-digit year (e.g., 2023)
- **taxpayerSSN**: 9-digit SSN
- **taxpayerName**: Filer name information
- **filingStatus**: One of: Single, MarriedFilingJointly, MarriedFilingSeparately, HeadOfHousehold, QualifyingWidow
- **preparerInfo**: Preparer details
- **efileIndicator**: OnlineFiler or ERO
- **softwareId**: Unique software identifier

## IRS Acknowledgment Codes

- **0000**: Accepted - Return transmitted successfully
- **1000**: Rejected - Business rule validation failed
- **2000**: Rejected - Schema validation failed
- **3000**: Rejected - Database validation failed
- **5000**: Accepted with Errors - Manual review required
- **9999**: System Error - Contact IRS e-Services

## IRS Resources

- **MEF Developer Guide**: https://www.irs.gov/e-file-providers/modernized-e-file-mef-for-software-developers
- **Schema & Business Rules**: https://www.irs.gov/e-file-providers/schema-and-business-rules
- **Publication 4164**: https://www.irs.gov/pub/irs-pdf/p4164.pdf (MEF Guide for Software Developers)
- **Publication 1345**: Handbook for Authorized IRS e-file Providers

## Testing

The system supports test mode transmission:

1. Set `testIndicator: 'T'` in transmission data
2. Use IRS test environment endpoints (configured in backend)
3. Test data will not be processed as actual tax returns
4. Switch to `testIndicator: 'P'` for production filing

## Compliance

All e-filing attempts and responses are logged with:

- Timestamp
- Event type (validation, transmission, acknowledgment, error)
- Severity level
- Return and submission identifiers
- Detailed event data
- Session and user agent information

Logs can be exported for auditing and compliance review.

## License

Internal use only for Ross Tax & Bookkeeping.
