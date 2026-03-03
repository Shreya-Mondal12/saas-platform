require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const UsageLog = require('../models/UsageLog');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Tenant.deleteMany({});
  await User.deleteMany({});
  await UsageLog.deleteMany({});

  // Create tenants
  const tenant1 = await Tenant.create({
    name: 'Acme Corp',
    subdomain: 'acme',
    plan: 'pro',
    status: 'active',
    billingEmail: 'admin@acme.com',
    branding: {
      primaryColor: '#4F46E5',
      secondaryColor: '#7C3AED',
      companyName: 'Acme Corp',
    },
    settings: { maxUsers: 50, analyticsEnabled: true },
  });

  const tenant2 = await Tenant.create({
    name: 'TechStart Inc',
    subdomain: 'techstart',
    plan: 'starter',
    status: 'trial',
    billingEmail: 'hello@techstart.io',
    branding: {
      primaryColor: '#059669',
      secondaryColor: '#0891B2',
      companyName: 'TechStart Inc',
    },
    settings: { maxUsers: 10, analyticsEnabled: true },
  });

  // Create users
  const adminUser = await User.create({
    tenant: tenant1._id,
    email: 'admin@acme.com',
    password: 'Password123!',
    firstName: 'Alice',
    lastName: 'Admin',
    role: 'admin',
  });

  await User.create({
    tenant: tenant1._id,
    email: 'user@acme.com',
    password: 'Password123!',
    firstName: 'Bob',
    lastName: 'User',
    role: 'user',
  });

  await User.create({
    tenant: tenant2._id,
    email: 'admin@techstart.io',
    password: 'Password123!',
    firstName: 'Carol',
    lastName: 'Tech',
    role: 'admin',
  });

  // Create superadmin (no tenant)
  const superTenant = await Tenant.create({
    name: 'Platform Admin',
    subdomain: 'platform-admin',
    plan: 'enterprise',
    status: 'active',
    billingEmail: 'super@platform.com',
    branding: { companyName: 'Platform Admin' },
    settings: { maxUsers: 999 },
  });

  await User.create({
    tenant: superTenant._id,
    email: 'super@platform.com',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'superadmin',
  });

  // Generate sample usage logs
  const actions = ['login', 'page_view', 'file_upload', 'settings_update', 'user_create', 'report_view', 'api_call'];
  const logs = [];
  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    logs.push({
      tenant: tenant1._id,
      user: adminUser._id,
      action: actions[Math.floor(Math.random() * actions.length)],
      resource: '/dashboard',
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  }
  await UsageLog.insertMany(logs);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nTest Accounts:');
  console.log('  Admin:      admin@acme.com    / Password123! (subdomain: acme)');
  console.log('  User:       user@acme.com     / Password123! (subdomain: acme)');
  console.log('  Admin 2:    admin@techstart.io / Password123! (subdomain: techstart)');
  console.log('  Superadmin: super@platform.com / SuperAdmin123!');
  console.log('\nSubdomains: acme, techstart, platform-admin');

  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
