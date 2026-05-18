import express from 'express';
import Technician from '../models/Technician.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/technicians
// @desc    Get all technicians
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { block, isAvailable } = req.query;
    
    let filter = {};
    if (block) filter.block = block.toUpperCase();
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const technicians = await Technician.find(filter)
      .populate('userId', 'name phone email')
      .sort({ block: 1, name: 1 });

    res.json({
      success: true,
      count: technicians.length,
      technicians
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technicians'
    });
  }
});

// @route   GET /api/technicians/:id
// @desc    Get single technician
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate('userId', 'name phone email');

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    res.json({
      success: true,
      technician
    });
  } catch (error) {
    console.error('Get technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technician'
    });
  }
});

// @route   PATCH /api/technicians/:id/leave
// @desc    Set technician leave
// @access  Private (technician, manager)
router.patch('/:id/leave', protect, authorize('technician', 'manager'), async (req, res) => {
  try {
    const { onLeave, leaveStartDate, leaveEndDate } = req.body;

    const technician = await Technician.findById(req.params.id);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    technician.onLeave = onLeave;
    if (onLeave) {
      technician.isAvailable = false;
      technician.leaveStartDate = leaveStartDate ? new Date(leaveStartDate) : new Date();
      technician.leaveEndDate = leaveEndDate ? new Date(leaveEndDate) : null;
    } else {
      technician.isAvailable = true;
      technician.leaveStartDate = null;
      technician.leaveEndDate = null;
    }

    await technician.save();

    res.json({
      success: true,
      technician
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave status'
    });
  }
});

// @route   PATCH /api/technicians/:id/availability
// @desc    Toggle technician availability
// @access  Private (technician, manager)
router.patch('/:id/availability', protect, authorize('technician', 'manager'), async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const technician = await Technician.findById(req.params.id);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    technician.isAvailable = isAvailable;
    await technician.save();

    res.json({
      success: true,
      technician
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability'
    });
  }
});

export default router;

