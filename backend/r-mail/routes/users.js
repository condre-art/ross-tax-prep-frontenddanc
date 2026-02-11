const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkPermission, checkRole } = require('../middleware/permissions');
const auditLogger = require('../middleware/auditLogger');
const bcrypt = require('bcryptjs');

// Get all users (admin/support only)
router.get('/', auth, checkPermission('manage_users'), async (req, res) => {
  try {
    const { page = 1, limit = 50, role, isActive } = req.query;

    const query = {};
    if (role) query.role = role;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Users can view their own profile, admins can view any profile
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (admin only)
router.post('/', auth, checkPermission('manage_users'), auditLogger('create_user', 'user'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'client',
      permissions: permissions || ['send', 'receive']
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.patch('/:id', auth, auditLogger('update_user', 'user'), async (req, res) => {
  try {
    const { firstName, lastName, role, permissions, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Users can update their own basic info, admins can update any user
    const isSelfUpdate = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelfUpdate && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only admins can change role, permissions, and isActive
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    
    if (isAdmin) {
      if (role) user.role = role;
      if (permissions) user.permissions = permissions;
      if (typeof isActive !== 'undefined') user.isActive = isActive;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, checkPermission('manage_users'), auditLogger('delete_user', 'user'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user password
router.post('/:id/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Users can only change their own password
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
