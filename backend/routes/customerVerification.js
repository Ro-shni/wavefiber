import express from 'express';
import Complaint from '../models/Complaint.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   PATCH /api/complaints/:id/verify
// @desc    Customer verifies if issue is resolved
// @access  Private (customer)
router.patch('/:id/verify', protect, authorize('customer'), async (req, res) => {
  try {
    const { isResolved, rejectionReason } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if customer owns this complaint
    if (complaint.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this complaint'
      });
    }

    // Check if complaint is in pending verification status
    if (complaint.customerVerificationStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Complaint is not awaiting verification'
      });
    }

    if (isResolved) {
      // Customer confirms issue is resolved
      complaint.customerVerificationStatus = 'VERIFIED';
      complaint.customerVerificationAt = new Date();
      complaint.status = 'CLOSED';
      
      // Final close time (stop timer permanently)
      if (!complaint.closedAt) {
        complaint.closedAt = new Date();
      }
      
      await complaint.save();

      res.json({
        success: true,
        message: 'Thank you for confirming! Complaint closed successfully.',
        complaint
      });
    } else {
      // Customer says issue not resolved - reopen
      if (!rejectionReason || rejectionReason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Please provide details about what is still not working (minimum 5 characters)'
        });
      }

      complaint.customerVerificationStatus = 'REJECTED';
      complaint.customerVerificationAt = new Date();
      complaint.customerRejectionReason = rejectionReason;
      complaint.status = 'IN PROGRESS'; // Reopen
      
      // Resume timer
      complaint.timerResumedAt = new Date();
      
      // Calculate paused duration
      if (complaint.timerPausedAt) {
        const pausedDuration = Math.round(
          (complaint.timerResumedAt - complaint.timerPausedAt) / (1000 * 60)
        );
        complaint.totalPausedMinutes += pausedDuration;
      }

      await complaint.save();

      res.json({
        success: true,
        message: 'Complaint reopened. Technician has been notified.',
        complaint
      });
    }
  } catch (error) {
    console.error('Verify complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing verification'
    });
  }
});

export default router;

