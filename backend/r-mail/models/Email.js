const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    email: { type: String, required: true },
    name: { type: String }
  },
  to: [{
    email: { type: String, required: true },
    name: { type: String }
  }],
  cc: [{
    email: { type: String },
    name: { type: String }
  }],
  bcc: [{
    email: { type: String },
    name: { type: String }
  }],
  subject: {
    type: String,
    required: true
  },
  body: {
    html: { type: String },
    text: { type: String, required: true }
  },
  attachments: [{
    filename: { type: String },
    contentType: { type: String },
    size: { type: Number },
    path: { type: String }
  }],
  status: {
    type: String,
    enum: ['draft', 'queued', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'draft'
  },
  isInternal: {
    type: Boolean,
    default: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'],
    default: 'inbox'
  },
  labels: [String],
  metadata: {
    ipAddress: String,
    userAgent: String,
    deliveryAttempts: { type: Number, default: 0 },
    lastDeliveryAttempt: Date,
    errorMessage: String
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

emailSchema.index({ 'from.email': 1, createdAt: -1 });
emailSchema.index({ 'to.email': 1, createdAt: -1 });
emailSchema.index({ status: 1, createdAt: -1 });
emailSchema.index({ folder: 1, createdAt: -1 });

module.exports = mongoose.model('RMailEmail', emailSchema);
