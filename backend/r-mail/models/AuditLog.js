const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RMailUser',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'send_email',
      'read_email',
      'delete_email',
      'create_user',
      'update_user',
      'delete_user',
      'create_domain',
      'update_domain',
      'delete_domain',
      'permission_change',
      'compliance_check',
      'export_data',
      'import_data'
    ]
  },
  resource: {
    type: String,
    enum: ['email', 'user', 'domain', 'system']
  },
  resourceId: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('RMailAuditLog', auditLogSchema);
