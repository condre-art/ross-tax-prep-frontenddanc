const express = require('express');
const router = express.Router();
const Return = require('../../models/Return');


// GET /api/returns (with optional filters)
// Example: /api/returns?client=CLIENTID&year=2025&status=filed&minRefund=1000&maxRefund=5000
router.get('/', async (req, res) => {
  const { client, year, status, minRefund, maxRefund } = req.query;
  const filter = {};
  if (client) filter.client = client;
  if (year) filter.year = Number(year);
  if (status) filter.status = status;
  if (minRefund || maxRefund) filter.refundAmount = {};
  if (minRefund) filter.refundAmount.$gte = Number(minRefund);
  if (maxRefund) filter.refundAmount.$lte = Number(maxRefund);
  const returns = await Return.find(filter).populate('client');
  res.json(returns);
});

// POST /api/returns
router.post('/', async (req, res) => {
  try {
    const ret = new Return(req.body);
    await ret.save();
    res.json(ret);
  } catch (err) {
    res.status(400).json({ error: 'Return creation failed' });
  }
});

// GET /api/returns/:id
router.get('/:id', async (req, res) => {
  const ret = await Return.findById(req.params.id).populate('client');
  if (!ret) return res.status(404).json({ error: 'Return not found' });
  res.json(ret);
});

module.exports = router;
