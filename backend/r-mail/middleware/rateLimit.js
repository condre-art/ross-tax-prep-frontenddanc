// Simple in-memory rate limiter
// In production, use redis-based rate limiting like express-rate-limit with redis store

const rateLimitStore = new Map();

const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.'
  } = options;

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const data = rateLimitStore.get(key);

    // Reset if window has passed
    if (now > data.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    // Increment count
    data.count++;

    // Check if limit exceeded
    if (data.count > max) {
      return res.status(429).json({ 
        error: message,
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
    }

    next();
  };
};

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports = rateLimit;
