import express from 'express';
import Complaint from '../models/Complaint.js';
import Technician from '../models/Technician.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (manager, staff)
router.get('/stats', protect, authorize('manager', 'staff'), async (req, res) => {
  try {
    // Total complaints
    const totalComplaints = await Complaint.countDocuments();
    
    // Complaints by status
    const openComplaints = await Complaint.countDocuments({ status: 'OPEN' });
    const assignedComplaints = await Complaint.countDocuments({ status: 'ASSIGNED' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'IN PROGRESS' });
    const closedComplaints = await Complaint.countDocuments({ status: 'CLOSED' });

    // Average resolution time (in hours)
    const avgResolutionResult = await Complaint.aggregate([
      { $match: { status: 'CLOSED', resolutionTimeMinutes: { $gt: 0 } } },
      { $group: { _id: null, avgResolution: { $avg: '$resolutionTimeMinutes' } } }
    ]);
    const avgResolutionTime = avgResolutionResult.length > 0 
      ? Math.round(avgResolutionResult[0].avgResolution) 
      : 0;

    // Average acknowledgement time (in minutes)
    const avgAckResult = await Complaint.aggregate([
      { $match: { acknowledgementTimeMinutes: { $gt: 0 } } },
      { $group: { _id: null, avgAck: { $avg: '$acknowledgementTimeMinutes' } } }
    ]);
    const avgAcknowledgementTime = avgAckResult.length > 0 
      ? Math.round(avgAckResult[0].avgAck) 
      : 0;

    // Complaints by type
    const complaintsByType = await Complaint.aggregate([
      { $group: { _id: '$complaintType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Complaints by block
    const complaintsByBlock = await Complaint.aggregate([
      { $group: { _id: '$block', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Per-block performance metrics
    const blockMetrics = await Complaint.aggregate([
      {
        $group: {
          _id: '$block',
          totalComplaints: { $sum: 1 },
          closedComplaints: {
            $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
          },
          avgAcknowledgementTime: {
            $avg: {
              $cond: [
                { $gt: ['$acknowledgementTimeMinutes', 0] },
                '$acknowledgementTimeMinutes',
                null
              ]
            }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: [{ $eq: ['$status', 'CLOSED'] }, { $gt: ['$resolutionTimeMinutes', 0] }] },
                '$resolutionTimeMinutes',
                null
              ]
            }
          }
        }
      },
      { $sort: { totalComplaints: -1 } }
    ]);

    // Technician performance
    const technicianPerformance = await Technician.aggregate([
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'technicianId',
          as: 'complaints'
        }
      },
      {
        $project: {
          name: 1,
          block: 1,
          totalComplaintsHandled: 1,
          totalComplaintsClosed: 1,
          currentWorkload: 1,
          averageResolutionTime: 1,
          isAvailable: 1,
          onLeave: 1
        }
      },
      { $sort: { totalComplaintsClosed: -1 } }
    ]);

    // Recent complaints (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentComplaints = await Complaint.find({
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    // Daily complaint trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalComplaints,
        openComplaints,
        assignedComplaints,
        inProgressComplaints,
        closedComplaints,
        avgResolutionTime,
        avgAcknowledgementTime,
        complaintsByType,
        complaintsByBlock,
        blockMetrics,
        technicianPerformance,
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/technician/:id
// @desc    Get technician-specific dashboard
// @access  Private (technician)
router.get('/technician/:id', protect, authorize('technician'), async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Get complaints assigned to this technician
    const myComplaints = await Complaint.find({ technicianId: technician._id })
      .sort({ createdAt: -1 });

    const activeComplaints = myComplaints.filter(c => 
      c.status === 'ASSIGNED' || c.status === 'IN PROGRESS'
    );

    const closedComplaints = myComplaints.filter(c => c.status === 'CLOSED');

    // Calculate actual stats from database
    const totalAssigned = myComplaints.length;
    const totalClosed = closedComplaints.length;
    const activeNow = activeComplaints.length;

    // Calculate average resolution time from actual closed complaints
    const closedWithTime = closedComplaints.filter(c => c.resolutionTimeMinutes > 0);
    const avgResolutionTime = closedWithTime.length > 0
      ? Math.round(closedWithTime.reduce((sum, c) => sum + c.resolutionTimeMinutes, 0) / closedWithTime.length)
      : 0;

    res.json({
      success: true,
      stats: {
        totalAssigned,
        totalClosed,
        currentWorkload: activeNow,
        activeNow,
        avgResolutionTime,
        activeComplaintsList: activeComplaints,
        recentClosed: closedComplaints.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Technician dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technician dashboard'
    });
  }
});

export default router;

