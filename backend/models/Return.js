const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'filed', 'accepted', 'rejected', 'refunded'], default: 'draft' },
  refundAmount: Number,
  efileId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Return', returnSchema);
