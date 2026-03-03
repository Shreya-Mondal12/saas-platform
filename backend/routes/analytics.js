const express = require('express');
const router = express.Router();
const UsageLog = require('../models/UsageLog');
const AnalyticsReport = require('../models/AnalyticsReport');
const { authenticate, authorize, logUsage } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/analytics/overview
// @desc    Get analytics overview for tenant
// @access  Admin
router.get('/overview', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const { days = 30 } = req.query;

  const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const [totalActions, topActions, dailyActivity, topUsers] = await Promise.all([
    UsageLog.countDocuments({ tenant: tenantId, timestamp: { $gte: since } }),

    UsageLog.aggregate([
      { $match: { tenant: tenantId, timestamp: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    UsageLog.aggregate([
      { $match: { tenant: tenantId, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    UsageLog.aggregate([
      { $match: { tenant: tenantId, timestamp: { $gte: since } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          email: '$userInfo.email',
          fullName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          count: 1,
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    overview: {
      totalActions,
      topActions: topActions.map(a => ({ action: a._id, count: a.count })),
      dailyActivity: dailyActivity.map(d => ({ date: d._id, count: d.count })),
      topUsers,
    },
  });
}));

// @route   GET /api/analytics/logs
// @desc    Get usage logs for tenant
// @access  Admin
router.get('/logs', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const { page = 1, limit = 50, action, userId } = req.query;

  const filter = { tenant: tenantId };
  if (action) filter.action = action;
  if (userId) filter.user = userId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    UsageLog.find(filter)
      .populate('user', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 }),
    UsageLog.countDocuments(filter),
  ]);

  res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}));

// @route   GET /api/analytics/reports
// @desc    Get AI-generated weekly reports
// @access  Admin
router.get('/reports', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const reports = await AnalyticsReport.find({ tenant: tenantId })
    .sort({ weekStartDate: -1 })
    .limit(12);
  res.json({ success: true, reports });
}));

// @route   POST /api/analytics/generate-report
// @desc    Manually trigger AI report generation
// @access  Admin
router.post('/generate-report', authenticate, authorize('admin', 'superadmin'), logUsage('report_generate'), asyncHandler(async (req, res) => {
  const tenantId = req.user.tenant._id || req.user.tenant;
  const report = await analyticsService.generateWeeklyReport(tenantId);
  res.json({ success: true, report });
}));

// @route   POST /api/analytics/log
// @desc    Log a frontend user action
// @access  Private
router.post('/log', authenticate, asyncHandler(async (req, res) => {
  const { action, resource, metadata } = req.body;
  const tenantId = req.user.tenant._id || req.user.tenant;

  await UsageLog.create({
    tenant: tenantId,
    user: req.user._id,
    action: action || 'page_view',
    resource,
    metadata: metadata || {},
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
  });

  res.json({ success: true });
}));

module.exports = router;
