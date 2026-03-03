const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { authenticate, logUsage } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register new tenant + admin user
// @access  Public
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { tenantName, subdomain, email, password, firstName, lastName, plan } = req.body;

  if (!tenantName || !subdomain || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Check subdomain availability
  const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
  if (existingTenant) {
    return res.status(409).json({ success: false, message: 'Subdomain already taken' });
  }

  // Create tenant
  const tenant = await Tenant.create({
    name: tenantName,
    subdomain: subdomain.toLowerCase(),
    plan: plan || 'trial',
    status: 'trial',
    billingEmail: email,
    branding: { companyName: tenantName },
  });

  // Create admin user
  const user = await User.create({
    tenant: tenant._id,
    email,
    password,
    firstName,
    lastName,
    role: 'admin',
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    tenant: {
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      branding: tenant.branding,
    },
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, subdomain } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  // Find tenant
  let tenant = req.tenant;
  if (!tenant && subdomain) {
    tenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase(), status: { $in: ['active', 'trial'] } });
  }

  if (!tenant) {
    return res.status(400).json({ success: false, message: 'Tenant not found or inactive' });
  }

  // Find user within tenant
  const user = await User.findOne({ email: email.toLowerCase(), tenant: tenant._id, isActive: true }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Update login info
  user.lastLogin = new Date();
  user.loginCount += 1;
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
    },
    tenant: {
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      branding: tenant.branding,
      plan: tenant.plan,
      status: tenant.status,
    },
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, logUsage('profile_view'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('tenant');
  res.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
    },
    tenant: user.tenant,
  });
}));

// @route   PUT /api/auth/me
// @desc    Update profile
// @access  Private
router.put('/me', authenticate, asyncHandler(async (req, res) => {
  const { firstName, lastName, preferences } = req.body;
  const update = {};
  if (firstName) update.firstName = firstName;
  if (lastName) update.lastName = lastName;
  if (preferences) update.preferences = { ...req.user.preferences, ...preferences };

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
  res.json({ success: true, user });
}));

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both passwords required' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
}));

module.exports = router;
