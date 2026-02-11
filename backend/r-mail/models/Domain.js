const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationMethod: {
    type: String,
    enum: ['dns', 'email', 'file'],
    default: 'dns'
  },
  dnsRecords: {
    spf: String,
    dkim: String,
    dmarc: String,
    mx: [String]
  },
  settings: {
    maxUsersPerDomain: { type: Number, default: 100 },
    maxStoragePerUser: { type: Number, default: 5368709120 }, // 5GB in bytes
    enableExternalEmail: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RMailUser',
    required: true
  },
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

module.exports = mongoose.model('RMailDomain', domainSchema);
