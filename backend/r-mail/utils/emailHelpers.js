const crypto = require('crypto');

const generateMessageId = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${random}@r-mail.com`;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isInternalEmail = (email, allowedDomains) => {
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};

const sanitizeEmailBody = (body) => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  // This is a placeholder - use proper HTML sanitization library in production
  let sanitized = body;
  
  // Remove script tags with variations
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, '');
  
  // Remove iframe tags with variations
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi, '');
  
  // Remove all event handlers (multiple passes to handle nested cases)
  for (let i = 0; i < 3; i++) {
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  }
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
};

const formatEmailAddress = (email, name) => {
  if (name) {
    return `"${name}" <${email}>`;
  }
  return email;
};

module.exports = {
  generateMessageId,
  validateEmail,
  isInternalEmail,
  sanitizeEmailBody,
  formatEmailAddress
};
