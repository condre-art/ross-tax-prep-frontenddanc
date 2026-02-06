const express = require('express');
const router = express.Router();


const User = require('../models/User');
const bcrypt = require('bcryptjs');


// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.json({ success: false, message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, message: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash, role });
    await user.save();
    res.json({ success: true, message: 'User registered' });
  } catch (err) {
    res.json({ success: false, message: 'Registration error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, role: user.role, message: 'Login successful' });
  } catch (err) {
    res.json({ success: false, message: 'Login error' });
  }
});

// POST /api/auth/mfa
router.post('/mfa', (req, res) => {
  // For demo, accept any 6-digit code
  const { mfaCode } = req.body;
  if (mfaCode && mfaCode.length === 6) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

module.exports = router;
