const mongoose = require('mongoose');

const analyticsReportSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    metrics: {
      totalLogins: { type: Number, default: 0 },
      uniqueUsers: { type: Number, default: 0 },
      totalActions: { type: Number, default: 0 },
      topActions: [{ action: String, count: Number }],
      topUsers: [{ userId: mongoose.Schema.Types.ObjectId, email: String, actionCount: Number }],
      dailyActivity: [{ date: String, count: Number }],
      newUsers: { type: Number, default: 0 },
    },
    aiInsights: {
      type: String, // AI-generated text analysis
      default: null,
    },
    aiInsightsGeneratedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

analyticsReportSchema.index({ tenant: 1, weekStartDate: -1 });

module.exports = mongoose.model('AnalyticsReport', analyticsReportSchema);
