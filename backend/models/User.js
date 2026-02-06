const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'ero', 'staff', 'client'], required: true },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String },
});

module.exports = mongoose.model('User', userSchema);
