const cron = require('node-cron');
const Tenant = require('../models/Tenant');
const { generateWeeklyReport } = require('./analyticsService');
const { logger } = require('../utils/logger');

// Run every Sunday at midnight UTC
cron.schedule('0 0 * * 0', async () => {
  logger.info('Running weekly analytics report generation...');

  try {
    const tenants = await Tenant.find({
      status: { $in: ['active', 'trial'] },
      'settings.analyticsEnabled': true,
    });

    logger.info(`Generating reports for ${tenants.length} tenants`);

    for (const tenant of tenants) {
      try {
        await generateWeeklyReport(tenant._id);
        logger.info(`✓ Report generated for ${tenant.name}`);
      } catch (err) {
        logger.error(`✗ Failed for ${tenant.name}: ${err.message}`);
      }
    }

    logger.info('Weekly analytics generation complete');
  } catch (err) {
    logger.error('Cron job error:', err.message);
  }
});

logger.info('Cron service started - weekly analytics every Sunday midnight UTC');
