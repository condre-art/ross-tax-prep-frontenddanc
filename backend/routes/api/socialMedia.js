const express = require('express');
const router = express.Router();


const fs = require('fs');
const path = require('path');
const TOKENS_FILE = path.join(__dirname, '../../social-tokens.json');

// POST /api/social-media/link
router.post('/link', async (req, res) => {
  const { platform, token } = req.body;
  if (!platform || !token) return res.status(400).json({ error: 'Missing fields' });
  let tokens = {};
  if (fs.existsSync(TOKENS_FILE)) {
    tokens = JSON.parse(fs.readFileSync(TOKENS_FILE));
  }
  tokens[platform] = token;
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  res.json({ success: true, platform });
});

// POST /api/social-media/post
router.post('/post', async (req, res) => {
  const { platform, message } = req.body;
  let tokens = {};
  if (fs.existsSync(TOKENS_FILE)) {
    tokens = JSON.parse(fs.readFileSync(TOKENS_FILE));
  }
  // Use tokens[platform] for API calls
  // Placeholder: Integrate with real social media APIs
  res.json({ success: true, platform, message, status: 'Posted (demo)', token: tokens[platform] });
});

module.exports = router;
