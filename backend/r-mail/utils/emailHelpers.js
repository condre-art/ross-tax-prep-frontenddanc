const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');

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
  // Use sanitize-html library for production-grade HTML sanitization
  // This prevents XSS attacks including:
  // - Script tags and event handlers
  // - Dangerous protocols (javascript:, data:, vbscript:)
  // - Unquoted attributes and style-based exploits
  
  return sanitizeHtml(body, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class', 'id']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // Remove all event handlers and dangerous attributes
    disallowedTagsMode: 'discard',
    // Remove style attributes to prevent CSS-based attacks
    allowedStyles: {}
  });
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
