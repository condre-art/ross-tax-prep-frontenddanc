const express = require('express');
const router = express.Router();
const Client = require('../../models/Client');


// GET /api/clients (with optional filters)
// Example: /api/clients?name=John&email=gmail&from=2025-01-01&to=2026-12-31
router.get('/', async (req, res) => {
  const { name, email, from, to } = req.query;
  const filter = {};
  if (name) filter.name = { $regex: name, $options: 'i' };
  if (email) filter.email = { $regex: email, $options: 'i' };
  if (from || to) filter.createdAt = {};
  if (from) filter.createdAt.$gte = new Date(from);
  if (to) filter.createdAt.$lte = new Date(to);
  const clients = await Client.find(filter);
  res.json(clients);
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(400).json({ error: 'Client creation failed' });
  }
});

module.exports = router;
