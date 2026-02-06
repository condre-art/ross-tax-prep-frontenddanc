const express = require('express');
const router = express.Router();

// POST /api/workflow-ai
router.post('/', async (req, res) => {
  // For demo, return a static workflow suggestion
  const { context } = req.body;
  res.json({
    workflow: [
      'Collect client documents',
      'Review tax situation',
      'Assign preparer',
      'Prepare return',
      'Client review',
      'E-file submission',
      'Track refund',
      'Follow-up compliance'
    ],
    context
  });
});

module.exports = router;
