const express = require('express');
const router = express.Router();

// GET /api/refund/status
router.get('/status', (req, res) => {
  res.json({ status: 'Pending Bank Approval', expected: '2-5 business days' });
});

module.exports = router;
