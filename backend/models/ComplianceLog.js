const mongoose = require('mongoose');

const complianceLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ComplianceLog', complianceLogSchema);
