const mongoose = require('mongoose');

const crypto = require('crypto');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  ssnEncrypted: { type: String },
  documentUploads: [{ type: String }], // file paths or URLs
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Encryption utility for SSN
clientSchema.methods.setSSN = function(ssn) {
  const key = process.env.CLIENT_SSN_KEY || 'defaultkey12345678';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  let encrypted = cipher.update(ssn, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  this.ssnEncrypted = iv.toString('hex') + ':' + encrypted;
};

clientSchema.methods.getSSN = function() {
  const key = process.env.CLIENT_SSN_KEY || 'defaultkey12345678';
  const [ivHex, encrypted] = this.ssnEncrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = mongoose.model('Client', clientSchema);
