import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    required: true
  },
  technicianName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedByName: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Check if leave is currently active
leaveRequestSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'APPROVED' && 
         now >= this.startDateTime && 
         now <= this.endDateTime;
};

// Calculate duration in hours
leaveRequestSchema.virtual('durationHours').get(function() {
  return Math.round((this.endDateTime - this.startDateTime) / (1000 * 60 * 60) * 10) / 10;
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;

