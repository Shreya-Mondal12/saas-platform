require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const { connectDB } = require('./config/database');
const { logger } = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const tenantMiddleware = require('./middleware/tenant');

// Import routes
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admin');

// Passport config
require('./config/passport')(passport);

const app = express();

// Connect to DB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Passport
app.use(passport.initialize());

// Tenant identification middleware (runs before routes)
app.use(tenantMiddleware);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

// Start weekly analytics cron job
require('./services/cronService');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
