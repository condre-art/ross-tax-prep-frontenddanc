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
  return body
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
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
