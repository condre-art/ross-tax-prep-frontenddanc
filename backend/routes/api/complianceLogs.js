const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ComplianceLog = require('../../models/ComplianceLog');
const { authenticateToken } = require('../../middleware/auth');

// Rate limiter for log creation to prevent abuse
const createLogLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
  message: { error: 'Too many log creation requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
router.post('/', createLogLimiter, authenticateToken, async (req, res) => {
  try {
    const log = new ComplianceLog(req.body);
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: 'Log creation failed' });
  }
});

module.exports = router;
