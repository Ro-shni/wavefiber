import express from 'express';
import Message from '../models/Message.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { sendNotification } from '../utils/sendNotification.js';

const router = express.Router();

// @route   GET /api/chat/:complaintId/messages
// @desc    Get all messages for a complaint chat
// @access  Private (customer who owns complaint, assigned technician)
router.get('/:complaintId/messages', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Authorization: only customer (owner) or assigned technician
    const isOwner = complaint.customerId.toString() === req.user._id.toString();
    const isAssignedTech = req.user.role === 'technician';
    const isStaffOrManager = ['staff', 'manager'].includes(req.user.role);
    if (!isOwner && !isAssignedTech && !isStaffOrManager) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ complaintId: req.params.complaintId })
      .sort({ createdAt: 1 });

    // Mark messages as read by this user
    await Message.updateMany(
      {
        complaintId: req.params.complaintId,
        senderId: { $ne: req.user._id },
        readBy: { $nin: [req.user._id] }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
});

// @route   POST /api/chat/:complaintId/messages
// @desc    Send a text message
// @access  Private
router.post('/:complaintId/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const message = await Message.create({
      complaintId: req.params.complaintId,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      content: content.trim(),
      messageType: 'text',
      readBy: [req.user._id]
    });

    // Emit via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(`complaint-${req.params.complaintId}`).emit('new-message', message);
    }

    // Send Notification
    const populatedComplaint = await Complaint.findById(complaint._id).populate('technicianId');
    const recipientId = req.user.role === 'customer' 
      ? (populatedComplaint.technicianId ? populatedComplaint.technicianId.userId : null)
      : populatedComplaint.customerId;

    if (recipientId) {
      await sendNotification(
        req, 
        recipientId, 
        'New Message', 
        `You have a new message from ${req.user.name} regarding complaint ${populatedComplaint.complaintType}.`, 
        'NEW_MESSAGE', 
        complaint._id
      );
    }

    // If customer sent the message, also notify all Managers
    if (req.user.role === 'customer') {
      const managers = await User.find({ role: 'manager' });
      for (const manager of managers) {
        await sendNotification(
          req,
          manager._id,
          'Customer Message',
          `Customer ${req.user.name} sent a message regarding complaint ${populatedComplaint.complaintType}.`,
          'NEW_MESSAGE',
          complaint._id
        );
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

// @route   POST /api/chat/:complaintId/voice-message
// @desc    Send a voice message
// @access  Private
router.post('/:complaintId/voice-message', protect, upload.single('voiceRecording'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file provided' });
    }

    const { duration } = req.body;
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const voiceUrl = `/uploads/voice-recordings/${req.file.filename}`;

    const message = await Message.create({
      complaintId: req.params.complaintId,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      content: '',
      messageType: 'voice',
      voiceUrl,
      voiceDuration: parseInt(duration) || 0,
      readBy: [req.user._id]
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`complaint-${req.params.complaintId}`).emit('new-message', message);
    }

    // Send Notification
    const populatedComplaint = await Complaint.findById(complaint._id).populate('technicianId');
    const recipientId = req.user.role === 'customer' 
      ? (populatedComplaint.technicianId ? populatedComplaint.technicianId.userId : null)
      : populatedComplaint.customerId;

    if (recipientId) {
      await sendNotification(
        req, 
        recipientId, 
        'New Voice Message', 
        `You have a new voice message from ${req.user.name}.`, 
        'NEW_MESSAGE', 
        complaint._id
      );
    }

    // If customer sent the message, also notify all Managers
    if (req.user.role === 'customer') {
      const managers = await User.find({ role: 'manager' });
      for (const manager of managers) {
        await sendNotification(
          req,
          manager._id,
          'Customer Voice Message',
          `Customer ${req.user.name} sent a voice message.`,
          'NEW_MESSAGE',
          complaint._id
        );
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send voice message error:', error);
    res.status(500).json({ success: false, message: 'Error sending voice message' });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get all complaint chats for the current user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    let complaints;

    if (req.user.role === 'customer') {
      // Customer sees their own complaints that have a technician assigned
      complaints = await Complaint.find({
        customerId: req.user._id,
        technicianId: { $exists: true, $ne: null }
      })
        .select('customerName technicianName complaintType status block createdAt technicianId')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'technician') {
      // Technician sees all complaints assigned to them
      const Technician = (await import('../models/Technician.js')).default;
      const technician = await Technician.findOne({ userId: req.user._id })
        || await Technician.findOne({ email: req.user.email });
      if (!technician) {
        return res.json({ success: true, conversations: [] });
      }
      complaints = await Complaint.find({
        technicianId: technician._id
      })
        .select('customerName technicianName complaintType status block createdAt customerId')
        .sort({ createdAt: -1 });
    } else {
      return res.json({ success: true, conversations: [] });
    }

    // Get unread counts per complaint
    const conversations = await Promise.all(
      complaints.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          complaintId: c._id,
          senderId: { $ne: req.user._id },
          readBy: { $nin: [req.user._id] }
        });
        const lastMessage = await Message.findOne({ complaintId: c._id })
          .sort({ createdAt: -1 })
          .select('content messageType senderName createdAt');

        return {
          complaintId: c._id,
          customerName: c.customerName,
          technicianName: c.technicianName,
          complaintType: c.complaintType,
          status: c.status,
          block: c.block,
          unreadCount,
          lastMessage
        };
      })
    );

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Error fetching conversations' });
  }
});

export default router;
