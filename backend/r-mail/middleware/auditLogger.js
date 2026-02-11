const AuditLog = require('../models/AuditLog');

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
          body: req.body,
          query: req.query
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
