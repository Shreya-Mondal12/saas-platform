const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const { authenticate, authorize, logUsage } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/tenants/current
// @desc    Get current tenant info (from middleware)
// @access  Private
router.get('/current', authenticate, asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.user.tenant._id || req.user.tenant);
  if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
  res.json({ success: true, tenant });
}));

// @route   PUT /api/tenants/branding
// @desc    Update tenant branding
// @access  Admin
router.put('/branding', authenticate, authorize('admin', 'superadmin'), logUsage('branding_update'), asyncHandler(async (req, res) => {
  const { primaryColor, secondaryColor, companyName } = req.body;
  const tenantId = req.user.tenant._id || req.user.tenant;

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $set: {
        'branding.primaryColor': primaryColor,
        'branding.secondaryColor': secondaryColor,
        'branding.companyName': companyName,
      },
    },
    { new: true, runValidators: true }
  );

  res.json({ success: true, tenant });
}));

// @route   PUT /api/tenants/settings
// @desc    Update tenant settings
// @access  Admin
router.put('/settings', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const { allowedDomains, analyticsEnabled, timezone, industry, country } = req.body;
  const tenantId = req.user.tenant._id || req.user.tenant;

  const updateObj = {};
  if (allowedDomains !== undefined) updateObj['settings.allowedDomains'] = allowedDomains;
  if (analyticsEnabled !== undefined) updateObj['settings.analyticsEnabled'] = analyticsEnabled;
  if (timezone) updateObj['metadata.timezone'] = timezone;
  if (industry) updateObj['metadata.industry'] = industry;
  if (country) updateObj['metadata.country'] = country;

  const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: updateObj }, { new: true });
  res.json({ success: true, tenant });
}));

// @route   GET /api/tenants/check-subdomain/:subdomain
// @desc    Check subdomain availability
// @access  Public
router.get('/check-subdomain/:subdomain', asyncHandler(async (req, res) => {
  const { subdomain } = req.params;
  const exists = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
  res.json({ success: true, available: !exists });
}));

module.exports = router;
