const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify Bearer token
 * Extracts and verifies JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('FATAL: JWT_SECRET environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      // Provide specific error messages for better debugging
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Unauthorized - Token has expired' });
      }
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
