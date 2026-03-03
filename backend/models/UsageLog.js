const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g., 'login', 'page_view', 'file_upload', 'api_call', 'feature_use'
    },
    resource: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    duration: Number, // ms
    statusCode: Number,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    // TTL: auto-delete logs older than 90 days
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

usageLogSchema.index({ tenant: 1, timestamp: -1 });
usageLogSchema.index({ tenant: 1, action: 1 });
usageLogSchema.index({ tenant: 1, user: 1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
