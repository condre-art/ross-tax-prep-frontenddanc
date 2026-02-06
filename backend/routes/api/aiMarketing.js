const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// POST /api/ai-marketing/generate
router.post('/generate', async (req, res) => {
  const { type } = req.body;
  let content = '';
  if (type === 'poll') {
    content = 'Poll: What is your biggest tax season challenge?\nA) Finding documents\nB) Understanding deductions\nC) Filing on time\nD) Other';
  } else if (type === 'discussion') {
    content = 'Discussion: Share your best tip for staying organized during tax season!';
  } else if (type === 'image') {
    content = 'Image: [AI-generated image of a happy client receiving a tax refund]';
  } else {
    content = 'Tip: Did you know you can maximize your refund by contributing to an IRA before tax day?';
  }
  res.json({ content });
});

// POST /api/ai-marketing/auto-post
router.post('/auto-post', async (req, res) => {
  const types = ['poll', 'discussion', 'image', 'tip'];
  const type = types[Math.floor(Math.random() * types.length)];
  // Generate content
  const genRes = await fetch('http://localhost:4000/api/ai-marketing/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  const { content } = await genRes.json();
  // Post to social media (demo: Facebook)
  const postRes = await fetch('http://localhost:4000/api/social-media/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook', message: content })
  });
  const postResult = await postRes.json();
  res.json({ type, content, postResult });
});

module.exports = router;
