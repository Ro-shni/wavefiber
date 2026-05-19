import express from 'express';
import Complaint from '../models/Complaint.js';
import { protect, authorize } from '../middleware/auth.js';
import { assignTechnicianToComplaint } from '../utils/assignTechnician.js';
import { sendNotification } from '../utils/sendNotification.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   POST /api/complaints
// @desc    Create new complaint
// @access  Private (customer, staff)
router.post('/', protect, async (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      block,
      vcRId,
      complaintType,
      description,
      paymentStatus,
      callReceivedBy
    } = req.body;

    if (!customerName || !phone || !address || !block || !complaintType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const complaint = await Complaint.create({
      customerId: req.user._id,
      customerName,
      phone,
      address,
      block: block.toUpperCase(),
      vcRId,
      complaintType,
      description,
      paymentStatus: paymentStatus || 'N/A',
      callReceivedBy: callReceivedBy || req.user.name
    });

    // Auto-assign technician if enabled
    await assignTechnicianToComplaint(complaint);

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('customerId', 'name phone')
      .populate('technicianId', 'name phone block userId');

    // Notify Customer
    if (populatedComplaint.customerId) {
      await sendNotification(req, populatedComplaint.customerId._id, 'Complaint Created', `Your complaint (${populatedComplaint.complaintType}) has been registered.`, 'COMPLAINT_UPDATE', populatedComplaint._id);
    }
    // Notify assigned Technician
    if (populatedComplaint.technicianId && populatedComplaint.technicianId.userId) {
      await sendNotification(req, populatedComplaint.technicianId.userId, 'New Complaint Assigned', `A new complaint (${populatedComplaint.complaintType}) has been assigned to you.`, 'COMPLAINT_UPDATE', populatedComplaint._id);
    }

    res.status(201).json({
      success: true,
      complaint: populatedComplaint
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating complaint'
    });
  }
});

// @route   GET /api/complaints
// @desc    Get all complaints (with filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, block, technicianId, customerId, startDate, endDate } = req.query;
    
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'technician') {
      // Find technician record
      const Technician = (await import('../models/Technician.js')).default;
      const technician = await Technician.findOne({ userId: req.user._id });
      if (technician) {
        filter.technicianId = technician._id;
      }
    }

    // Apply additional filters
    if (status) filter.status = status;
    if (block) filter.block = block.toUpperCase();
    if (technicianId) filter.technicianId = technicianId;
    if (customerId) filter.customerId = customerId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const complaints = await Complaint.find(filter)
      .populate('customerId', 'name phone')
      .populate('technicianId', 'name phone block')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaints'
    });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('customerId', 'name phone address')
      .populate('technicianId', 'name phone block');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaint'
    });
  }
});

// @route   PATCH /api/complaints/:id/acknowledge
// @desc    Technician acknowledges complaint
// @access  Private (technician)
router.patch('/:id/acknowledge', protect, authorize('technician'), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.acknowledgedAt = new Date();
    complaint.status = 'IN PROGRESS';
    await complaint.save();

    // Notify Customer
    await sendNotification(req, complaint.customerId, 'Complaint Acknowledged', `Technician is working on your complaint.`, 'COMPLAINT_UPDATE', complaint._id);

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Acknowledge complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging complaint'
    });
  }
});

// @route   PATCH /api/complaints/:id/close
// @desc    Close complaint (pause timer, await customer verification)
// @access  Private (technician, manager)
router.patch('/:id/close', protect, authorize('technician', 'manager', 'staff'), async (req, res) => {
  try {
    const {
      technicianFeedback,
      callCenterFeedback,
      supervisorFeedback,
      usedMaterial,
      remarks
    } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Pause timer and set to pending verification
    complaint.status = 'CLOSED'; // Technically closed by technician
    complaint.timerPausedAt = new Date();
    complaint.customerVerificationStatus = 'PENDING';
    
    if (technicianFeedback) complaint.technicianFeedback = technicianFeedback;
    if (callCenterFeedback) complaint.callCenterFeedback = callCenterFeedback;
    if (supervisorFeedback) complaint.supervisorFeedback = supervisorFeedback;
    if (usedMaterial) complaint.usedMaterial = usedMaterial;
    if (remarks) complaint.remarks = remarks;

    await complaint.save();

    // Notify Customer
    await sendNotification(req, complaint.customerId, 'Complaint Closed', `Your complaint has been marked as closed. Please verify.`, 'COMPLAINT_UPDATE', complaint._id);

    // Update technician stats
    if (complaint.technicianId) {
      const Technician = (await import('../models/Technician.js')).default;
      const technician = await Technician.findById(complaint.technicianId);
      if (technician) {
        technician.currentWorkload = Math.max(0, technician.currentWorkload - 1);
        technician.totalComplaintsClosed += 1;
        
        // Calculate average resolution time
        const closedComplaints = await Complaint.find({
          technicianId: technician._id,
          status: 'CLOSED',
          resolutionTimeMinutes: { $gt: 0 }
        });
        
        if (closedComplaints.length > 0) {
          const totalResolutionTime = closedComplaints.reduce((sum, c) => sum + c.resolutionTimeMinutes, 0);
          technician.averageResolutionTime = Math.round(totalResolutionTime / closedComplaints.length);
        }
        
        await technician.save();
      }
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Close complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing complaint'
    });
  }
});

// @route   PATCH /api/complaints/:id/reassign
// @desc    Reassign complaint to different technician
// @access  Private (manager, staff)
router.patch('/:id/reassign', protect, authorize('manager', 'staff'), async (req, res) => {
  try {
    const { technicianId } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const Technician = (await import('../models/Technician.js')).default;
    const technician = await Technician.findById(technicianId);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Update old technician workload
    if (complaint.technicianId) {
      const oldTechnician = await Technician.findById(complaint.technicianId);
      if (oldTechnician) {
        oldTechnician.currentWorkload = Math.max(0, oldTechnician.currentWorkload - 1);
        await oldTechnician.save();
      }
    }

    // Assign to new technician
    complaint.technicianId = technician._id;
    complaint.technicianName = technician.name;
    complaint.assignedAt = new Date();
    complaint.status = 'ASSIGNED';
    await complaint.save();

    // Update new technician workload
    technician.currentWorkload += 1;
    technician.totalComplaintsHandled += 1;
    await technician.save();

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Reassign complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reassigning complaint'
    });
  }
});

// @route   POST /api/complaints/:id/upload-voice
// @desc    Upload voice recording for a complaint
// @access  Private (customer, technician, staff, manager)
router.post('/:id/upload-voice', protect, upload.single('voiceRecording'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const { duration } = req.body;

    if (!duration) {
      return res.status(400).json({
        success: false,
        message: 'Recording duration is required'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Allow: customer (own complaint), assigned technician, staff, manager
    const isOwner = complaint.customerId.toString() === req.user._id.toString();
    const isStaffOrManager = ['staff', 'manager'].includes(req.user.role);
    const isTechnician = req.user.role === 'technician';
    if (!isOwner && !isStaffOrManager && !isTechnician) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload voice for this complaint'
      });
    }

    const recordingUrl = `/uploads/voice-recordings/${req.file.filename}`;
    const parsedDuration = parseInt(duration);

    // Add to voiceRecordings array
    complaint.voiceRecordings.push({
      url: recordingUrl,
      duration: parsedDuration,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      uploaderName: req.user.name,
      uploaderRole: req.user.role
    });

    // Also update legacy single-recording fields (for backward compat)
    complaint.voiceRecordingUrl = recordingUrl;
    complaint.voiceRecordingDuration = parsedDuration;
    complaint.voiceRecordingMimeType = req.file.mimetype;
    complaint.voiceRecordingUploadedAt = new Date();

    await complaint.save();

    // Determine recipient for notification
    const populatedComplaint = await Complaint.findById(complaint._id).populate('technicianId');
    const recipientId = req.user.role === 'customer' 
      ? (populatedComplaint.technicianId ? populatedComplaint.technicianId.userId : null)
      : populatedComplaint.customerId;

    if (recipientId) {
      await sendNotification(
        req, 
        recipientId, 
        'New Voice Note', 
        `${req.user.name} added a voice note to your complaint.`, 
        'NEW_MESSAGE', 
        complaint._id
      );
    }

    // If customer sent it, also notify managers
    if (req.user.role === 'customer') {
      const User = (await import('../models/User.js')).default;
      const managers = await User.find({ role: 'manager' });
      for (const manager of managers) {
        await sendNotification(
          req,
          manager._id,
          'Customer Voice Note',
          `Customer ${req.user.name} added a voice note.`,
          'NEW_MESSAGE',
          complaint._id
        );
      }
    }

    res.json({
      success: true,
      message: 'Voice recording uploaded successfully',
      complaint
    });
  } catch (error) {
    console.error('Upload voice recording error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading voice recording'
    });
  }
});

export default router;

