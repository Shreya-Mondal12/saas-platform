const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const UsageLog = require('../models/UsageLog');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// All routes require superadmin
router.use(authenticate, authorize('superadmin'));

// @route   GET /api/admin/tenants
// @desc    List all tenants
router.get('/tenants', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.name = new RegExp(search, 'i');

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [tenants, total] = await Promise.all([
    Tenant.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    Tenant.countDocuments(filter),
  ]);

  res.json({ success: true, tenants, total });
}));

// @route   PUT /api/admin/tenants/:id/status
// @desc    Update tenant status
router.put('/tenants/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json({ success: true, tenant });
}));

// @route   PUT /api/admin/tenants/:id/plan
// @desc    Update tenant plan & limits
router.put('/tenants/:id/plan', asyncHandler(async (req, res) => {
  const { plan, maxUsers, storageLimit } = req.body;
  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    { plan, 'settings.maxUsers': maxUsers, 'settings.storageLimit': storageLimit },
    { new: true }
  );
  res.json({ success: true, tenant });
}));

// @route   GET /api/admin/stats
// @desc    Platform-wide stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [totalTenants, activeTenants, totalUsers, totalLogs] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ status: 'active' }),
    User.countDocuments(),
    UsageLog.countDocuments({ timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
  ]);

  res.json({ success: true, stats: { totalTenants, activeTenants, totalUsers, totalLogs } });
}));

module.exports = router;
