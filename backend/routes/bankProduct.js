const express = require('express');
const router = express.Router();

// POST /api/bank-product/apply
router.post('/apply', (req, res) => {
  // For demo, always approve
  res.json({
    status: 'approved',
    applicationId: 'RA-2026-0001',
    message: 'Application approved'
  });
});

module.exports = router;
