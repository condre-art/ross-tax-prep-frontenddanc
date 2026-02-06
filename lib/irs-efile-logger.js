/**
 * IRS E-File Logging Utility
 * 
 * Provides comprehensive logging for all e-filing attempts and responses
 * to meet IRS compliance requirements.
 * 
 * All logs are stored with timestamps and can be exported for auditing purposes.
 */

/**
 * Log entry types
 */
export const LOG_TYPES = {
  VALIDATION: 'validation',
  TRANSMISSION: 'transmission',
  ACKNOWLEDGMENT: 'acknowledgment',
  ERROR: 'error',
  STATUS_CHECK: 'status_check'
};

/**
 * Log severity levels
 */
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * In-memory log storage (in production, this should be persisted to a database)
 */
let logStore = [];

/**
 * Logs an e-file event
 * @param {Object} logEntry - Log entry data
 * @param {string} logEntry.type - Log type from LOG_TYPES
 * @param {string} logEntry.level - Log level from LOG_LEVELS
 * @param {string} logEntry.message - Log message
 * @param {Object} logEntry.data - Additional log data
 * @param {string} logEntry.returnId - Return ID
 * @param {string} logEntry.submissionId - Submission ID (if available)
 */
export function logEfileEvent(logEntry) {
  const entry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    type: logEntry.type,
    level: logEntry.level || LOG_LEVELS.INFO,
    message: logEntry.message,
    data: logEntry.data || {},
    returnId: logEntry.returnId,
    submissionId: logEntry.submissionId,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    sessionId: getSessionId()
  };
  
  logStore.push(entry);
  
  // Console output for debugging
  if (typeof console !== 'undefined') {
    const consoleMethod = entry.level === LOG_LEVELS.ERROR || entry.level === LOG_LEVELS.CRITICAL ? 'error' :
                          entry.level === LOG_LEVELS.WARNING ? 'warn' : 'log';
    console[consoleMethod](`[E-FILE ${entry.type.toUpperCase()}] ${entry.message}`, entry.data);
  }
  
  // In production, send to backend API for persistence
  sendLogToBackend(entry);
  
  return entry;
}

/**
 * Logs a validation event
 * @param {Object} validationResult - Validation result
 * @param {string} returnId - Return ID
 */
export function logValidation(validationResult, returnId) {
  return logEfileEvent({
    type: LOG_TYPES.VALIDATION,
    level: validationResult.isValid ? LOG_LEVELS.INFO : LOG_LEVELS.WARNING,
    message: validationResult.isValid ? 
      'MEF schema validation passed' : 
      `MEF schema validation failed: ${validationResult.errors.length} error(s)`,
    data: {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      validationTimestamp: validationResult.timestamp
    },
    returnId
  });
}

/**
 * Logs a transmission attempt
 * @param {string} submissionId - Submission ID
 * @param {string} returnId - Return ID
 * @param {Object} transmissionData - Transmission metadata
 */
export function logTransmission(submissionId, returnId, transmissionData) {
  return logEfileEvent({
    type: LOG_TYPES.TRANSMISSION,
    level: LOG_LEVELS.INFO,
    message: `E-file transmission initiated for return ${returnId}`,
    data: {
      submissionId,
      transmissionId: transmissionData.transmissionId,
      testIndicator: transmissionData.testIndicator,
      method: transmissionData.method
    },
    returnId,
    submissionId
  });
}

/**
 * Logs an acknowledgment received from IRS
 * @param {Object} acknowledgment - Acknowledgment data
 * @param {string} returnId - Return ID
 */
export function logAcknowledgment(acknowledgment, returnId) {
  const isSuccess = acknowledgment.acknowledgmentCode === '0000' || 
                    acknowledgment.acknowledgmentCode === '5000';
  
  return logEfileEvent({
    type: LOG_TYPES.ACKNOWLEDGMENT,
    level: isSuccess ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR,
    message: isSuccess ? 
      'IRS acknowledgment received - Return accepted' : 
      `IRS acknowledgment received - Return rejected (${acknowledgment.acknowledgmentCode})`,
    data: {
      acknowledgmentCode: acknowledgment.acknowledgmentCode,
      timestamp: acknowledgment.timestamp,
      errors: acknowledgment.errors || [],
      submissionId: acknowledgment.submissionId
    },
    returnId,
    submissionId: acknowledgment.submissionId
  });
}

/**
 * Logs an error event
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {string} returnId - Return ID
 * @param {string} submissionId - Submission ID (if available)
 */
export function logError(error, context, returnId, submissionId = null) {
  return logEfileEvent({
    type: LOG_TYPES.ERROR,
    level: LOG_LEVELS.ERROR,
    message: `E-file error in ${context}: ${error.message}`,
    data: {
      error: error.message,
      stack: error.stack,
      context
    },
    returnId,
    submissionId
  });
}

/**
 * Logs a status check event
 * @param {string} submissionId - Submission ID
 * @param {string} returnId - Return ID
 * @param {Object} status - Status data
 */
export function logStatusCheck(submissionId, returnId, status) {
  return logEfileEvent({
    type: LOG_TYPES.STATUS_CHECK,
    level: LOG_LEVELS.INFO,
    message: `E-file status checked for submission ${submissionId}`,
    data: {
      status: status.status,
      ackCode: status.ack_code,
      irsSubmissionId: status.irs_submission_id
    },
    returnId,
    submissionId
  });
}

/**
 * Retrieves logs for a specific return
 * @param {string} returnId - Return ID
 * @returns {Array} Array of log entries
 */
export function getLogsForReturn(returnId) {
  return logStore.filter(log => log.returnId === returnId);
}

/**
 * Retrieves logs for a specific submission
 * @param {string} submissionId - Submission ID
 * @returns {Array} Array of log entries
 */
export function getLogsForSubmission(submissionId) {
  return logStore.filter(log => log.submissionId === submissionId);
}

/**
 * Exports all logs as JSON
 * @returns {string} JSON string of all logs
 */
export function exportLogs() {
  return JSON.stringify(logStore, null, 2);
}

/**
 * Clears all logs (use with caution)
 */
export function clearLogs() {
  logStore = [];
}

/**
 * Generates a unique log ID
 * @returns {string} Log ID
 */
function generateLogId() {
  return `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Gets or creates a session ID
 * @returns {string} Session ID
 */
function getSessionId() {
  if (typeof sessionStorage !== 'undefined') {
    let sessionId = sessionStorage.getItem('efile_session_id');
    if (!sessionId) {
      sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('efile_session_id', sessionId);
    }
    return sessionId;
  }
  return 'unknown';
}

/**
 * Sends log entry to backend API for persistence
 * @param {Object} logEntry - Log entry
 */
async function sendLogToBackend(logEntry) {
  // In production, this should send to a backend API
  // For now, we'll just store in localStorage as a backup
  if (typeof localStorage !== 'undefined') {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('efile_logs') || '[]');
      storedLogs.push(logEntry);
      
      // Keep only last 1000 logs in localStorage
      if (storedLogs.length > 1000) {
        storedLogs.shift();
      }
      
      localStorage.setItem('efile_logs', JSON.stringify(storedLogs));
    } catch (err) {
      console.error('Failed to store log in localStorage:', err);
    }
  }
  
  // Uncomment in production to send to backend API
  /*
  try {
    await fetch('/api/efile/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
  } catch (err) {
    console.error('Failed to send log to backend:', err);
  }
  */
}
