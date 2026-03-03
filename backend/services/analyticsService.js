const Anthropic = require('@anthropic-ai/sdk');
const UsageLog = require('../models/UsageLog');
const AnalyticsReport = require('../models/AnalyticsReport');
const Tenant = require('../models/Tenant');
const { logger } = require('../utils/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Aggregate usage metrics for a tenant over a date range
 */
const aggregateMetrics = async (tenantId, startDate, endDate) => {
  const [totalActions, topActions, dailyActivity, uniqueUsers, topUsers, newUsers] = await Promise.all([
    UsageLog.countDocuments({ tenant: tenantId, timestamp: { $gte: startDate, $lte: endDate } }),

    UsageLog.aggregate([
      { $match: { tenant: tenantId, timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    UsageLog.aggregate([
      { $match: { tenant: tenantId, timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    UsageLog.distinct('user', { tenant: tenantId, timestamp: { $gte: startDate, $lte: endDate } }),

    UsageLog.aggregate([
      { $match: { tenant: tenantId, timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' },
      },
      { $unwind: '$userInfo' },
      { $project: { email: '$userInfo.email', name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] }, actionCount: '$count' } },
    ]),

    // New users registered this week
    require('../models/User').countDocuments({
      tenant: tenantId,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
  ]);

  const loginLogs = await UsageLog.countDocuments({
    tenant: tenantId,
    action: 'login',
    timestamp: { $gte: startDate, $lte: endDate },
  });

  return {
    totalLogins: loginLogs,
    uniqueUsers: uniqueUsers.length,
    totalActions,
    topActions: topActions.map(a => ({ action: a._id, count: a.count })),
    topUsers,
    dailyActivity: dailyActivity.map(d => ({ date: d._id, count: d.count })),
    newUsers,
  };
};

/**
 * Generate AI insights using Claude
 */
const generateAIInsights = async (tenant, metrics, weekStartDate, weekEndDate) => {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key') {
    return generateMockInsights(metrics);
  }

  const prompt = `You are an analytics expert for a SaaS platform. Analyze the following weekly usage data for tenant "${tenant.name}" and provide actionable insights.

Week: ${weekStartDate.toDateString()} to ${weekEndDate.toDateString()}

Metrics:
- Total logins: ${metrics.totalLogins}
- Unique active users: ${metrics.uniqueUsers}
- Total actions performed: ${metrics.totalActions}
- New users registered: ${metrics.newUsers}

Top Actions:
${metrics.topActions.map(a => `  - ${a.action}: ${a.count} times`).join('\n')}

Daily Activity:
${metrics.dailyActivity.map(d => `  - ${d.date}: ${d.count} actions`).join('\n')}

Top Users by Activity:
${metrics.topUsers.map(u => `  - ${u.name || u.email}: ${u.actionCount} actions`).join('\n')}

Tenant Plan: ${tenant.plan}

Please provide:
1. A brief executive summary (2-3 sentences)
2. Key highlights and achievements
3. Concerning trends (if any)
4. 3 specific actionable recommendations to improve engagement
5. Comparison context (what these numbers suggest about platform health)

Keep the tone professional but conversational. Format with clear sections.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].text;
  } catch (err) {
    logger.error('Claude AI error:', err.message);
    return generateMockInsights(metrics);
  }
};

const generateMockInsights = (metrics) => {
  return `## Weekly Analytics Summary

**Executive Summary**
This week your platform recorded ${metrics.totalActions} total user actions with ${metrics.uniqueUsers} unique active users and ${metrics.totalLogins} logins. ${metrics.newUsers > 0 ? `You welcomed ${metrics.newUsers} new users this week.` : 'No new users joined this week.'}

**Key Highlights**
- Most popular feature: ${metrics.topActions[0]?.action || 'N/A'} (${metrics.topActions[0]?.count || 0} times)
- User engagement rate appears ${metrics.totalActions > 50 ? 'healthy' : 'low'} for your current user base
- ${metrics.topUsers[0] ? `Most active user: ${metrics.topUsers[0].name || metrics.topUsers[0].email}` : 'No user activity recorded'}

**Recommendations**
1. **Boost Engagement**: Send re-engagement emails to users who haven't logged in this week
2. **Feature Adoption**: Promote underused features through in-app tooltips or tutorials
3. **Retention**: Consider adding a weekly digest email to keep users coming back

*AI insights powered by Claude. Configure your Anthropic API key to enable full AI analysis.*`;
};

/**
 * Generate weekly report for a tenant
 */
const generateWeeklyReport = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const weekEndDate = new Date();
  const weekStartDate = new Date(weekEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Check if report already exists for this week
  const existingReport = await AnalyticsReport.findOne({
    tenant: tenantId,
    weekStartDate: { $gte: weekStartDate },
  });

  if (existingReport && existingReport.status === 'completed') {
    // Regenerate insights only
    const insights = await generateAIInsights(tenant, existingReport.metrics, weekStartDate, weekEndDate);
    existingReport.aiInsights = insights;
    existingReport.aiInsightsGeneratedAt = new Date();
    await existingReport.save();
    return existingReport;
  }

  // Create report
  const report = await AnalyticsReport.create({
    tenant: tenantId,
    weekStartDate,
    weekEndDate,
    status: 'processing',
  });

  try {
    const metrics = await aggregateMetrics(tenantId, weekStartDate, weekEndDate);
    const aiInsights = await generateAIInsights(tenant, metrics, weekStartDate, weekEndDate);

    report.metrics = metrics;
    report.aiInsights = aiInsights;
    report.aiInsightsGeneratedAt = new Date();
    report.status = 'completed';
    await report.save();

    // Update tenant lastAnalyticsRun
    await Tenant.findByIdAndUpdate(tenantId, { lastAnalyticsRun: new Date() });

    logger.info(`Analytics report generated for tenant ${tenant.name}`);
  } catch (err) {
    report.status = 'failed';
    await report.save();
    logger.error(`Report generation failed for tenant ${tenantId}:`, err.message);
  }

  return report;
};

module.exports = { generateWeeklyReport, aggregateMetrics };
