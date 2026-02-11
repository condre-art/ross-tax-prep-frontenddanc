const express = require('express');
const router = express.Router();
const Domain = require('../models/Domain');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const auditLogger = require('../middleware/auditLogger');

// Get all domains
router.get('/', auth, checkPermission('manage_domains'), async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive, isVerified } = req.query;

    const query = {};
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';
    if (typeof isVerified !== 'undefined') query.isVerified = isVerified === 'true';

    const domains = await Domain.find(query)
      .populate('owner', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Domain.countDocuments(query);

    res.json({
      domains,
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

// Get single domain
router.get('/:id', auth, checkPermission('manage_domains'), async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id)
      .populate('owner', 'email firstName lastName');

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json(domain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create domain
router.post('/', auth, checkPermission('manage_domains'), auditLogger('create_domain', 'domain'), async (req, res) => {
  try {
    const { name, settings } = req.body;

    // Check if domain already exists
    const existingDomain = await Domain.findOne({ name: name.toLowerCase() });
    if (existingDomain) {
      return res.status(400).json({ error: 'Domain already exists' });
    }

    // Create domain
    const domain = new Domain({
      name: name.toLowerCase(),
      owner: req.user._id,
      settings: settings || {}
    });

    await domain.save();

    res.status(201).json({
      message: 'Domain created successfully',
      domain
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update domain
router.patch('/:id', auth, checkPermission('manage_domains'), auditLogger('update_domain', 'domain'), async (req, res) => {
  try {
    const { isActive, isVerified, settings, dnsRecords } = req.body;

    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Update fields
    if (typeof isActive !== 'undefined') domain.isActive = isActive;
    if (typeof isVerified !== 'undefined') domain.isVerified = isVerified;
    if (settings) domain.settings = { ...domain.settings, ...settings };
    if (dnsRecords) domain.dnsRecords = { ...domain.dnsRecords, ...dnsRecords };

    await domain.save();

    res.json({
      message: 'Domain updated successfully',
      domain
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete domain
router.delete('/:id', auth, checkPermission('manage_domains'), auditLogger('delete_domain', 'domain'), async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    await domain.deleteOne();

    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify domain
router.post('/:id/verify', auth, checkPermission('manage_domains'), async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // In a real implementation, this would check DNS records
    // For now, we'll just mark it as verified
    domain.isVerified = true;
    await domain.save();

    res.json({
      message: 'Domain verified successfully',
      domain
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
