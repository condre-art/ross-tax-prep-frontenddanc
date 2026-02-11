const AuditLog = require('../models/AuditLog');

// List of sensitive fields that should not be logged
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'hashedPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'apiSecret',
  'secret',
  'sessionToken',
  'creditCard',
  'ssn',
  'socialSecurityNumber',
  'bankAccount',
  'accountNumber'
];

/**
 * Recursively sanitize an object by removing or masking sensitive fields
 * @param {object} obj - Object to sanitize
 * @param {array} sensitiveFields - Array of field names to redact
 * @returns {object} - Sanitized copy of the object
 */
const sanitizeObject = (obj, sensitiveFields = SENSITIVE_FIELDS) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sensitiveFields));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (sensitiveFields.some(field => field.toLowerCase() === key.toLowerCase())) {
        // Redact sensitive fields
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(obj[key], sensitiveFields);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
};

const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      res.send = originalSend;
      
      const log = {
        user: req.user?._id,
        action,
        resource,
        resourceId: req.params.id || req.body?.id,
        details: {
          method: req.method,
          path: req.originalUrl,
          body: sanitizeObject(req.body),
          query: sanitizeObject(req.query)
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: res.statusCode < 400 ? 'success' : 'failure',
        errorMessage: res.statusCode >= 400 ? data : undefined
      };

      AuditLog.create(log).catch(err => {
        console.error('Audit log error:', err);
      });

      return res.send(data);
    };

    next();
  };
};

module.exports = auditLogger;
