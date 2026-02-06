const express = require('express');
const router = express.Router();
const ComplianceLog = require('../../models/ComplianceLog');


// GET /api/compliance-logs (with optional filters)
// Example: /api/compliance-logs?user=USERID&action=efile&from=2025-01-01&to=2026-12-31
router.get('/', async (req, res) => {
  const { user, action, from, to } = req.query;
  const filter = {};
  if (user) filter.user = user;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (from || to) filter.createdAt = {};
  if (from) filter.createdAt.$gte = new Date(from);
  if (to) filter.createdAt.$lte = new Date(to);
  const logs = await ComplianceLog.find(filter).populate('user');
  res.json(logs);
});

// POST /api/compliance-logs
router.post('/', async (req, res) => {
  try {
    const log = new ComplianceLog(req.body);
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: 'Log creation failed' });
  }
});

module.exports = router;
