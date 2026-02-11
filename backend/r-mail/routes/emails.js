const express = require('express');
const router = express.Router();
const Email = require('../models/Email');
const Domain = require('../models/Domain');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const auditLogger = require('../middleware/auditLogger');
const { generateMessageId, validateEmail, isInternalEmail, sanitizeEmailBody } = require('../utils/emailHelpers');
const emailService = require('../utils/emailService');

// Get emails for user (inbox, sent, etc.)
router.get('/', auth, checkPermission('receive'), async (req, res) => {
  try {
    const { folder = 'inbox', page = 1, limit = 50 } = req.query;
    const userEmail = req.user.email;

    const query = {
      folder,
      $or: [
        { 'to.email': userEmail },
        { 'from.email': userEmail },
        { 'cc.email': userEmail },
        { 'bcc.email': userEmail }
      ]
    };

    const emails = await Email.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Email.countDocuments(query);

    res.json({
      emails,
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

// Get single email
router.get('/:id', auth, checkPermission('receive'), async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Check if user has access to this email
    const userEmail = req.user.email;
    const hasAccess = 
      email.to.some(t => t.email === userEmail) ||
      email.from.email === userEmail ||
      email.cc.some(c => c.email === userEmail) ||
      email.bcc.some(b => b.email === userEmail);

    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as read if it's in the recipient's inbox
    if (email.to.some(t => t.email === userEmail) && !email.isRead) {
      email.isRead = true;
      email.readAt = new Date();
      await email.save();
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compose and send email
router.post('/', auth, checkPermission('send'), auditLogger('send_email', 'email'), async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, attachments } = req.body;

    // Validate domain ownership - extract domain from user's email and verify they own it
    const userEmailDomain = req.user.email.split('@')[1];
    const userDomain = await Domain.findOne({ 
      name: userEmailDomain,
      isActive: true,
      isVerified: true
    });

    if (!userDomain) {
      return res.status(403).json({ error: 'User domain is not verified or active. Cannot send emails.' });
    }

    // Verify user is associated with this domain
    const isOwner = userDomain.owner.toString() === req.user._id.toString();
    const isAssignedUser = req.user.domain && req.user.domain.toString() === userDomain._id.toString();

    if (!isOwner && !isAssignedUser) {
      return res.status(403).json({ error: 'Not authorized to send emails from this domain.' });
    }

    // Validate recipients
    const allRecipients = [...to, ...(cc || []), ...(bcc || [])];
    for (const recipient of allRecipients) {
      if (!validateEmail(recipient.email)) {
        return res.status(400).json({ error: `Invalid email: ${recipient.email}` });
      }
    }

    // Generate message ID
    const messageId = generateMessageId();

    // Sanitize body
    const sanitizedBody = {
      text: body.text,
      html: body.html ? sanitizeEmailBody(body.html) : undefined
    };

    // Check if email is internal or external
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
    const hasExternalRecipients = allRecipients.some(
      r => !isInternalEmail(r.email, allowedDomains)
    );

    // Create email document
    const email = new Email({
      messageId,
      from: {
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`
      },
      to,
      cc: cc || [],
      bcc: bcc || [],
      subject,
      body: sanitizedBody,
      attachments: attachments || [],
      status: 'queued',
      isInternal: !hasExternalRecipients,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await email.save();

    // If external email, attempt to send via SMTP
    if (hasExternalRecipients) {
      try {
        const result = await emailService.sendExternalEmail({
          from: email.from.email,
          to: email.to.map(t => t.email),
          cc: email.cc.map(c => c.email),
          bcc: email.bcc.map(b => b.email),
          subject: email.subject,
          body: email.body,
          attachments: email.attachments
        });

        if (result.success) {
          email.status = 'sent';
          email.sentAt = new Date();
        } else {
          email.status = 'failed';
          email.metadata.errorMessage = result.error;
        }
      } catch (error) {
        email.status = 'failed';
        email.metadata.errorMessage = error.message;
      }
    } else {
      // Internal email - mark as delivered immediately
      email.status = 'delivered';
      email.sentAt = new Date();
      email.deliveredAt = new Date();
    }

    await email.save();

    // Create inbox copies for recipients (TO, CC, and BCC)
    const allEmailRecipients = [
      ...email.to,
      ...email.cc,
      ...email.bcc
    ];
    
    for (const recipient of allEmailRecipients) {
      const inboxEmail = new Email({
        ...email.toObject(),
        _id: undefined,
        folder: 'inbox',
        isRead: false
      });
      await inboxEmail.save();
    }

    res.status(201).json({
      message: 'Email sent successfully',
      email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update email (mark as read, star, move to folder, etc.)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { isRead, isStarred, folder, labels } = req.body;
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Check if user has access
    const userEmail = req.user.email;
    const hasAccess = 
      email.to.some(t => t.email === userEmail) ||
      email.from.email === userEmail ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update fields
    if (typeof isRead !== 'undefined') {
      email.isRead = isRead;
      if (isRead && !email.readAt) {
        email.readAt = new Date();
      }
    }
    if (typeof isStarred !== 'undefined') email.isStarred = isStarred;
    if (folder) email.folder = folder;
    if (labels) email.labels = labels;

    await email.save();

    res.json({
      message: 'Email updated successfully',
      email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete email
router.delete('/:id', auth, auditLogger('delete_email', 'email'), async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Check if user has access
    const userEmail = req.user.email;
    const hasAccess = 
      email.from.email === userEmail ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await email.deleteOne();

    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
