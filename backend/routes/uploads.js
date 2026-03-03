const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadToS3 } = require('../config/aws');
const Tenant = require('../models/Tenant');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Multer memory storage (files go to buffer, then S3)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Mock upload for dev (when S3 is not configured)
const mockUpload = async (buffer, key, contentType) => {
  // In production, use real S3. For demo, return a placeholder URL
  return `https://via.placeholder.com/200x200?text=Logo`;
};

// @route   POST /api/uploads/logo
// @desc    Upload tenant logo
// @access  Admin
router.post('/logo', authenticate, authorize('admin', 'superadmin'), upload.single('logo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const tenantId = req.user.tenant._id || req.user.tenant;
  const ext = path.extname(req.file.originalname);
  const key = `tenants/${tenantId}/logo-${uuidv4()}${ext}`;

  let logoUrl;
  try {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key') {
      logoUrl = await uploadToS3(req.file.buffer, key, req.file.mimetype);
    } else {
      // Dev fallback - return a data URL
      logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
  } catch (err) {
    logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  await Tenant.findByIdAndUpdate(tenantId, { 'branding.logoUrl': logoUrl });

  res.json({ success: true, logoUrl });
}));

// @route   POST /api/uploads/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const User = require('../models/User');
  let avatarUrl;
  try {
    const tenantId = req.user.tenant._id || req.user.tenant;
    const key = `tenants/${tenantId}/avatars/${req.user._id}-${uuidv4()}`;
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key') {
      avatarUrl = await uploadToS3(req.file.buffer, key, req.file.mimetype);
    } else {
      avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
  } catch {
    avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
  res.json({ success: true, avatarUrl });
}));

module.exports = router;
