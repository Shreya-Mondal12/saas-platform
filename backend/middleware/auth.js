const passport = require('passport');
const UsageLog = require('../models/UsageLog');

// Authenticate JWT
const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Unauthorized - Invalid or expired token',
      });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

// Ensure user belongs to the current tenant
const requireTenantMatch = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({ success: false, message: 'Tenant context required' });
  }
  if (req.user.role === 'superadmin') return next(); // superadmin bypasses
  if (!req.user.tenant || req.user.tenant._id.toString() !== req.tenant._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied for this tenant' });
  }
  next();
};

// Log usage
const logUsage = (action, resource = null) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (req.user && req.tenantId) {
        try {
          await UsageLog.create({
            tenant: req.tenantId,
            user: req.user._id,
            action,
            resource,
            metadata: { method: req.method, path: req.path },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            statusCode: res.statusCode,
            timestamp: new Date(),
          });
        } catch (e) {
          // Don't fail request due to logging error
        }
      }
    });
    next();
  };
};

module.exports = { authenticate, authorize, requireTenantMatch, logUsage };
