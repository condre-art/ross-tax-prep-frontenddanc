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
  // WARNING: This is a basic sanitization implementation for scaffolding purposes.
  // For production, MUST use a proper HTML sanitization library such as:
  // - dompurify (with jsdom for Node.js): npm install dompurify jsdom
  // - sanitize-html: npm install sanitize-html
  // - xss: npm install xss
  //
  // Example with dompurify:
  // const createDOMPurify = require('dompurify');
  // const { JSDOM } = require('jsdom');
  // const window = new JSDOM('').window;
  // const DOMPurify = createDOMPurify(window);
  // return DOMPurify.sanitize(body);
  
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
  
  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
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
