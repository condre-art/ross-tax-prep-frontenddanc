const express = require('express');
const router = express.Router();
const Task = require('../../models/Task');

// POST /api/auto-task
router.post('/', async (req, res) => {
  const { suggestion, assignedTo } = req.body;
  if (!suggestion || !assignedTo) return res.status(400).json({ error: 'Missing fields' });
  const task = new Task({ label: suggestion, assignedTo });
  await task.save();
  res.json(task);
});

module.exports = router;
