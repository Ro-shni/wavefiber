import express from 'express';
import Settings from '../models/Settings.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private (manager)
router.get('/', protect, authorize('manager'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({ autoAssignEnabled: true });
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

// @route   PATCH /api/settings/autoassign
// @desc    Toggle auto-assignment
// @access  Private (manager)
router.patch('/autoassign', protect, authorize('manager'), async (req, res) => {
  try {
    const { enabled } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({ 
        autoAssignEnabled: enabled,
        updatedBy: req.user._id
      });
    } else {
      settings.autoAssignEnabled = enabled;
      settings.lastUpdated = new Date();
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    res.json({
      success: true,
      message: `Auto-assignment ${enabled ? 'enabled' : 'disabled'}`,
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

export default router;

