const express = require('express');
const router = express.Router();

// POST /api/ai-persona
router.post('/', async (req, res) => {
  const { persona, question } = req.body;
  let response = '';
  let disclaimer = '';
  if (persona === 'tax-attorney') {
    response = `As your AI Tax Attorney, I recommend: [AI-generated answer based on question: "${question}"]`;
    disclaimer = 'Disclaimer: This is not legal advice. For specific tax or legal matters, consult a licensed professional.';
  } else if (persona === 'marketer') {
    response = `As your AI Brand Ambassador, here is a marketing/recruiting suggestion: [AI-generated answer based on question: "${question}"]`;
    disclaimer = 'Disclaimer: This is a marketing suggestion. Please verify compliance with all advertising and privacy laws.';
  } else {
    response = 'Persona not recognized.';
    disclaimer = '';
  }
  res.json({ response, disclaimer });
});

module.exports = router;
