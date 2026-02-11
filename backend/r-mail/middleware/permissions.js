const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has all permissions
    if (user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    if (!user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredPermission
      });
    }

    next();
  };
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient role privileges',
        required: allowedRoles,
        current: user.role
      });
    }

    next();
  };
};

module.exports = { checkPermission, checkRole };
