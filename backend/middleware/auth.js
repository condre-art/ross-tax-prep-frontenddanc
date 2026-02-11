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

  const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
