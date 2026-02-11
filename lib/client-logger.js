/**
 * Client-Side Error Logging Utility
 * 
 * Provides centralized error logging and monitoring for frontend operations
 * with backend integration for audit trails and cloud monitoring.
 */

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
 * Log an error event to backend
 * @param {Object} errorData - Error information
 * @param {string} errorData.message - Error message
 * @param {string} errorData.context - Context where error occurred
 * @param {string} errorData.level - Log level from LOG_LEVELS
 * @param {Object} errorData.details - Additional error details
 * @param {Error} errorData.error - Original error object (optional)
 */
export async function logError(errorData) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: errorData.level || LOG_LEVELS.ERROR,
    message: errorData.message,
    context: errorData.context,
    details: errorData.details || {},
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId()
  };

  // Include error stack if available
  if (errorData.error) {
    logEntry.details.errorMessage = errorData.error.message;
    logEntry.details.errorStack = errorData.error.stack;
  }

  // Console output for debugging
  const consoleMethod = logEntry.level === LOG_LEVELS.ERROR || logEntry.level === LOG_LEVELS.CRITICAL ? 'error' :
                        logEntry.level === LOG_LEVELS.WARNING ? 'warn' : 'log';
  console[consoleMethod](`[${logEntry.level.toUpperCase()}] ${logEntry.context}: ${logEntry.message}`, logEntry.details);

  // Send to backend for audit logging
  await sendLogToBackend(logEntry);

  return logEntry;
}

/**
 * Log authentication-related errors
 * @param {string} action - Authentication action (login, logout, mfa_enroll, etc.)
 * @param {Error} error - Error object
 * @param {Object} details - Additional context
 */
export async function logAuthError(action, error, details = {}) {
  return logError({
    message: `Authentication error during ${action}`,
    context: 'authentication',
    level: LOG_LEVELS.ERROR,
    error,
    details: {
      action,
      ...details
    }
  });
}

/**
 * Log API request errors
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Error} error - Error object
 * @param {Object} details - Additional context
 */
export async function logAPIError(endpoint, method, error, details = {}) {
  return logError({
    message: `API error: ${method} ${endpoint}`,
    context: 'api',
    level: LOG_LEVELS.ERROR,
    error,
    details: {
      endpoint,
      method,
      ...details
    }
  });
}

/**
 * Log workflow-related errors
 * @param {string} workflowAction - Workflow action (load, update, transition, etc.)
 * @param {Error} error - Error object
 * @param {Object} details - Additional context
 */
export async function logWorkflowError(workflowAction, error, details = {}) {
  return logError({
    message: `Workflow error during ${workflowAction}`,
    context: 'workflow',
    level: LOG_LEVELS.ERROR,
    error,
    details: {
      workflowAction,
      ...details
    }
  });
}

/**
 * Log task-related errors
 * @param {string} taskAction - Task action (load, update, complete, etc.)
 * @param {Error} error - Error object
 * @param {Object} details - Additional context
 */
export async function logTaskError(taskAction, error, details = {}) {
  return logError({
    message: `Task error during ${taskAction}`,
    context: 'task',
    level: LOG_LEVELS.ERROR,
    error,
    details: {
      taskAction,
      ...details
    }
  });
}

/**
 * Send log entry to backend API
 * @param {Object} logEntry - Log entry
 */
async function sendLogToBackend(logEntry) {
  try {
    const authToken = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header only if token exists
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Attempt to send to backend audit logging API
    const response = await fetch('/api/logs/client', {
      method: 'POST',
      headers,
      body: JSON.stringify(logEntry)
    });

    if (!response.ok) {
      // Fallback to localStorage if backend is unavailable
      storeLogLocally(logEntry);
    }
  } catch (error) {
    // If backend is unreachable, store locally
    storeLogLocally(logEntry);
    console.warn('Backend logging unavailable, storing locally:', error);
  }
}

/**
 * Store log locally as fallback
 * @param {Object} logEntry - Log entry
 */
function storeLogLocally(logEntry) {
  try {
    const storedLogs = JSON.parse(localStorage.getItem('client_error_logs') || '[]');
    storedLogs.push(logEntry);
    
    // Keep only last 500 logs in localStorage
    if (storedLogs.length > 500) {
      storedLogs.shift();
    }
    
    localStorage.setItem('client_error_logs', JSON.stringify(storedLogs));
  } catch (err) {
    console.error('Failed to store log in localStorage:', err);
  }
}

/**
 * Get or create session ID
 * @returns {string} Session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get authentication token from storage
 * @returns {string|null} Auth token
 */
function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

/**
 * Get locally stored logs
 * @returns {Array} Array of log entries
 */
export function getLocalLogs() {
  try {
    return JSON.parse(localStorage.getItem('client_error_logs') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear locally stored logs
 */
export function clearLocalLogs() {
  localStorage.removeItem('client_error_logs');
}
