const express = require('express');
const router = express.Router();

let tasks = [
  { id: 'task1', label: 'Collect taxpayer info', completed: false },
  { id: 'task2', label: 'Submit Refund Advantage app', completed: false },
  { id: 'task3', label: 'Transmit efile', completed: false },
  { id: 'task4', label: 'Notify client', completed: false }
];

// GET /api/tasks
router.get('/', (req, res) => {
  res.json(tasks);
});

// POST /api/tasks/update
router.post('/update', (req, res) => {
  const { id, completed } = req.body;
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = completed;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

module.exports = router;
