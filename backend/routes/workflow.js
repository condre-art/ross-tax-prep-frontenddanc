const express = require('express');
const router = express.Router();

// GET /api/workflow/progress
router.get('/progress', (req, res) => {
  res.json({ step: 2, max: 5, label: 'Application Submitted' });
});

module.exports = router;
