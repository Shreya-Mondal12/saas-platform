const Tenant = require('../models/Tenant');

const tenantMiddleware = async (req, res, next) => {
  try {
    let tenantIdentifier = null;

    // 1. Check X-Tenant-ID header
    if (req.headers['x-tenant-id']) {
      tenantIdentifier = req.headers['x-tenant-id'];
    }

    // 2. Check subdomain (e.g., acme.yourdomain.com)
    if (!tenantIdentifier && req.hostname) {
      const parts = req.hostname.split('.');
      if (parts.length >= 3) {
        // subdomain.domain.tld
        tenantIdentifier = parts[0];
      } else if (parts.length === 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
        tenantIdentifier = parts[0];
      }
    }

    // 3. Check query param (fallback for dev)
    if (!tenantIdentifier && req.query.tenant) {
      tenantIdentifier = req.query.tenant;
    }

    if (tenantIdentifier && tenantIdentifier !== 'localhost' && tenantIdentifier !== 'api') {
      const tenant = await Tenant.findOne({
        subdomain: tenantIdentifier.toLowerCase(),
        status: { $in: ['active', 'trial'] },
      });

      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant._id;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = tenantMiddleware;
