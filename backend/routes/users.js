const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize, logUsage } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/users
// @desc    Get all users for tenant
// @access  Admin
router.get('/', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const { page = 1, limit = 20, search, role, isActive } = req.query;

  const filter = { tenant: tenantId };
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    users,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  });
}));

// @route   POST /api/users
// @desc    Create user in tenant
// @access  Admin
router.post('/', authenticate, authorize('admin', 'superadmin'), logUsage('user_create'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const { email, password, firstName, lastName, role } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  // Check user limit
  const Tenant = require('../models/Tenant');
  const tenant = await Tenant.findById(tenantId);
  const userCount = await User.countDocuments({ tenant: tenantId });

  if (userCount >= tenant.settings.maxUsers && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: `User limit (${tenant.settings.maxUsers}) reached` });
  }

  const user = await User.create({
    tenant: tenantId,
    email,
    password,
    firstName,
    lastName,
    role: role === 'admin' ? 'admin' : 'user',
  });

  res.status(201).json({
    success: true,
    user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
  });
}));

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Admin
router.get('/:id', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const user = await User.findOne({ _id: req.params.id, tenant: tenantId }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Admin
router.put('/:id', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const { firstName, lastName, role, isActive } = req.body;

  const update = {};
  if (firstName) update.firstName = firstName;
  if (lastName) update.lastName = lastName;
  if (role) update.role = role;
  if (isActive !== undefined) update.isActive = isActive;

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, tenant: tenantId },
    update,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  
  // Can't delete self
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }

  const user = await User.findOneAndDelete({ _id: req.params.id, tenant: tenantId });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User deleted' });
}));

module.exports = router;
