const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial', 'cancelled'],
      default: 'trial',
    },
    branding: {
      logoUrl: { type: String, default: null },
      primaryColor: { type: String, default: '#4F46E5' },
      secondaryColor: { type: String, default: '#7C3AED' },
      companyName: { type: String, default: '' },
      favicon: { type: String, default: null },
    },
    settings: {
      allowedDomains: [String],
      maxUsers: { type: Number, default: 5 },
      storageLimit: { type: Number, default: 1024 }, // MB
      analyticsEnabled: { type: Boolean, default: true },
      customDomain: { type: String, default: null },
    },
    metadata: {
      industry: String,
      country: String,
      timezone: { type: String, default: 'UTC' },
    },
    billingEmail: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
    lastAnalyticsRun: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: user count
tenantSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'tenant',
  count: true,
});

// Index
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ status: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
