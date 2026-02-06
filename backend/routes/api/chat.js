const express = require('express');
const router = express.Router();
const ChatMessage = require('../../models/ChatMessage');

// GET /api/chat?user=USERID
router.get('/', async (req, res) => {
  const { user } = req.query;
  const filter = user ? { $or: [{ from: user }, { to: user }] } : {};
  const messages = await ChatMessage.find(filter).populate('from to').sort({ createdAt: 1 });
  res.json(messages);
});

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const msg = new ChatMessage(req.body);
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(400).json({ error: 'Message send failed' });
  }
});

module.exports = router;
