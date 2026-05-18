import express from 'express';
import LeaveRequest from '../models/LeaveRequest.js';
import Technician from '../models/Technician.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/leave-requests
// @desc    Create new leave request
// @access  Private (technician)
router.post('/', protect, authorize('technician'), async (req, res) => {
  try {
    const { startDateTime, endDateTime, reason } = req.body;

    if (!startDateTime || !endDateTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start time, end time, and reason'
      });
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date/time must be after start date/time'
      });
    }

    // Find technician record
    const technician = await Technician.findOne({ userId: req.user._id });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician record not found'
      });
    }

    const leaveRequest = await LeaveRequest.create({
      technicianId: technician._id,
      technicianName: technician.name,
      userId: req.user._id,
      startDateTime: start,
      endDateTime: end,
      reason
    });

    res.status(201).json({
      success: true,
      leaveRequest
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave request'
    });
  }
});

// @route   GET /api/leave-requests
// @desc    Get leave requests (all for manager, own for technician)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'technician') {
      filter.userId = req.user._id;
    }

    const { status } = req.query;
    if (status) {
      filter.status = status;
    }

    const leaveRequests = await LeaveRequest.find(filter)
      .populate('userId', 'name phone')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaveRequests.length,
      leaveRequests
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests'
    });
  }
});

// @route   PATCH /api/leave-requests/:id/approve
// @desc    Approve leave request
// @access  Private (manager)
router.patch('/:id/approve', protect, authorize('manager'), async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave request already processed'
      });
    }

    leaveRequest.status = 'APPROVED';
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvedByName = req.user.name;
    leaveRequest.approvedAt = new Date();
    await leaveRequest.save();

    // Update technician status if leave is currently active
    const now = new Date();
    if (now >= leaveRequest.startDateTime && now <= leaveRequest.endDateTime) {
      await Technician.findByIdAndUpdate(leaveRequest.technicianId, {
        onLeave: true,
        isAvailable: false,
        leaveStartDate: leaveRequest.startDateTime,
        leaveEndDate: leaveRequest.endDateTime
      });
    }

    res.json({
      success: true,
      message: 'Leave request approved',
      leaveRequest
    });
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave request'
    });
  }
});

// @route   PATCH /api/leave-requests/:id/reject
// @desc    Reject leave request
// @access  Private (manager)
router.patch('/:id/reject', protect, authorize('manager'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave request already processed'
      });
    }

    leaveRequest.status = 'REJECTED';
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvedByName = req.user.name;
    leaveRequest.approvedAt = new Date();
    leaveRequest.rejectionReason = rejectionReason || 'Not specified';
    await leaveRequest.save();

    res.json({
      success: true,
      message: 'Leave request rejected',
      leaveRequest
    });
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave request'
    });
  }
});

// @route   DELETE /api/leave-requests/:id
// @desc    Cancel leave request (only pending)
// @access  Private (technician - own requests only)
router.delete('/:id', protect, authorize('technician'), async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave request'
      });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel processed leave request'
      });
    }

    await leaveRequest.deleteOne();

    res.json({
      success: true,
      message: 'Leave request cancelled'
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling leave request'
    });
  }
});

export default router;

