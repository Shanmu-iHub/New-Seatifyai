const express = require('express');
const router = express.Router();
const { PlatformConfig } = require('../models');
const auth = require('../middleware/auth');

// Admin guard middleware
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// GET /api/settings — Fetch current platform configuration
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    let config = await PlatformConfig.findOne({});
    if (!config) {
      // First time: create defaults
      config = await PlatformConfig.create({});
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/settings — Update platform configuration
router.put('/', auth, isAdmin, async (req, res) => {
  try {
    const { platformFee, platformGST, supportEmail, platformName, razorpayKeyId, maintenanceMode } = req.body;

    // Validate
    if (platformFee !== undefined && (isNaN(platformFee) || platformFee < 0)) {
      return res.status(400).json({ message: 'Platform fee must be a non-negative number' });
    }
    if (platformGST !== undefined && (isNaN(platformGST) || platformGST < 0 || platformGST > 100)) {
      return res.status(400).json({ message: 'GST must be between 0 and 100' });
    }
    if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      return res.status(400).json({ message: 'Invalid support email address' });
    }

    const updateFields = {};
    if (platformFee !== undefined) updateFields.platformFee = Number(platformFee);
    if (platformGST !== undefined) updateFields.platformGST = Number(platformGST);
    if (supportEmail) updateFields.supportEmail = supportEmail.trim();
    if (platformName) updateFields.platformName = platformName.trim();
    if (razorpayKeyId !== undefined) updateFields.razorpayKeyId = razorpayKeyId.trim();
    if (maintenanceMode !== undefined) updateFields.maintenanceMode = Boolean(maintenanceMode);

    let config = await PlatformConfig.findOneAndUpdate(
      {},
      { $set: updateFields },
      { new: true, upsert: true }
    );

    console.log('✅ Platform configuration updated by admin');
    res.json({ message: 'Platform configuration saved successfully', config });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
