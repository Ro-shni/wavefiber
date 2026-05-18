import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Complaint from '../models/Complaint.js';

const router = express.Router();

// @route   PATCH /api/complaints/:id/pause
// @desc    Pause timer for a complaint
// @access  Private (technician)
router.patch('/:id/pause', protect, authorize('technician', 'manager'), async (req, res) => {
  try {
    const { pauseReason } = req.body;
    const complaintId = req.params.id;

    if (!pauseReason || pauseReason.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a reason for pausing (minimum 5 characters)' 
      });
    }

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot pause a closed complaint' });
    }

    if (complaint.isPaused) {
      return res.status(400).json({ success: false, message: 'Complaint is already paused' });
    }

    // Pause the timer
    complaint.isPaused = true;
    complaint.pauseHistory.push({
      pausedAt: new Date(),
      pauseReason: pauseReason.trim(),
      pausedByTechnician: complaint.technicianName || req.user.name
    });

    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint timer paused successfully',
      complaint
    });
  } catch (error) {
    console.error('Error pausing complaint timer:', error);
    res.status(500).json({ success: false, message: 'Server error pausing timer' });
  }
});

// @route   PATCH /api/complaints/:id/resume
// @desc    Resume timer for a complaint
// @access  Private (technician)
router.patch('/:id/resume', protect, authorize('technician', 'manager'), async (req, res) => {
  try {
    const complaintId = req.params.id;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (!complaint.isPaused) {
      return res.status(400).json({ success: false, message: 'Complaint is not paused' });
    }

    // Resume the timer
    complaint.isPaused = false;
    
    // Update the last pause entry with resume time
    const lastPause = complaint.pauseHistory[complaint.pauseHistory.length - 1];
    if (lastPause && !lastPause.resumedAt) {
      lastPause.resumedAt = new Date();
      const pauseDuration = Math.round((lastPause.resumedAt - lastPause.pausedAt) / (1000 * 60));
      lastPause.durationMinutes = pauseDuration;
      
      // Add to total paused time
      complaint.totalPausedMinutes += pauseDuration;
    }

    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint timer resumed successfully',
      complaint
    });
  } catch (error) {
    console.error('Error resuming complaint timer:', error);
    res.status(500).json({ success: false, message: 'Server error resuming timer' });
  }
});

// @route   GET /api/complaints/:id/pause-history
// @desc    Get pause history for a complaint
// @access  Private
router.get('/:id/pause-history', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).select('pauseHistory isPaused totalPausedMinutes');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({
      success: true,
      isPaused: complaint.isPaused,
      totalPausedMinutes: complaint.totalPausedMinutes,
      pauseHistory: complaint.pauseHistory
    });
  } catch (error) {
    console.error('Error fetching pause history:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pause history' });
  }
});

export default router;

