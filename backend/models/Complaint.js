import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  block: {
    type: String,
    required: true,
    trim: true
  },
  vcRId: {
    type: String,
    trim: true
  },
  complaintType: {
    type: String,
    enum: [
      'NEWCONNECTION',
      'PIN COMPLAINT',
      'NO SIGNAL',
      'Channels NOT CLEAR',
      'WIRE COMPLAINT',
      'INESERT Smart CARD',
      'RECONNECTION',
      'SHIFTING',
      'RECONNECTION+SHIFTING',
      'SETOP BOX COMPLAINT',
      'POWER COMPLAINT',
      'BOX EXCHANGE',
      'APSFL COMPLAINT',
      'NO CHANNELS',
      'SHIFTING+ BOX EXCHANGE',
      'ROOM CHANGE',
      'TUNING',
      'shifting+reconnection',
      'TV CHANGE',
      'REMOTE COMPLAINT',
      'VIDEO AND Audio COMPLAINT',
      'HDMI cable complaint',
      'Temporary Disconnection',
      'Channel Activation',
      'Payment Issue',
      'others'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'UNPAID', 'PENDING', 'N/A'],
    default: 'N/A'
  },
  status: {
    type: String,
    enum: ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'CLOSED', 'CANCELLED'],
    default: 'OPEN'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician'
  },
  technicianName: {
    type: String
  },
  callReceivedBy: {
    type: String
  },
  technicianFeedback: {
    type: String
  },
  callCenterFeedback: {
    type: String
  },
  supervisorFeedback: {
    type: String
  },
  usedMaterial: {
    type: String
  },
  remarks: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignedAt: {
    type: Date
  },
  acknowledgedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  customerVerificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: null
  },
  customerVerificationAt: {
    type: Date
  },
  customerRejectionReason: {
    type: String
  },
  timerPausedAt: {
    type: Date
  },
  timerResumedAt: {
    type: Date
  },
  totalPausedMinutes: {
    type: Number,
    default: 0
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  acknowledgementTimeMinutes: {
    type: Number,
    default: 0
  },
  resolutionTimeMinutes: {
    type: Number,
    default: 0
  },
  // Manual pause/resume by technician
  isPaused: {
    type: Boolean,
    default: false
  },
  pauseHistory: [{
    pausedAt: Date,
    resumedAt: Date,
    pauseReason: String,
    pausedByTechnician: String,
    durationMinutes: Number
  }],
  // Voice Recording Support (legacy single recording)
  voiceRecordingUrl: {
    type: String,
    default: null
  },
  voiceRecordingDuration: {
    type: Number,
    default: 0
  },
  voiceRecordingMimeType: {
    type: String,
    default: 'audio/webm'
  },
  voiceRecordingUploadedAt: {
    type: Date,
    default: null
  },
  // Multiple voice recordings from different roles
  voiceRecordings: [{
    url: { type: String, required: true },
    duration: { type: Number, default: 0 },
    mimeType: { type: String, default: 'audio/webm' },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploaderName: { type: String },
    uploaderRole: { type: String, enum: ['customer', 'technician', 'staff', 'manager'] }
  }]
});

// Calculate times before saving
complaintSchema.pre('save', function(next) {
  // Calculate acknowledgement time when complaint is acknowledged
  if (this.acknowledgedAt && this.assignedAt) {
    const ackTime = Math.round((this.acknowledgedAt - this.assignedAt) / (1000 * 60));
    this.acknowledgementTimeMinutes = Math.max(0, ackTime);
  }

  // Calculate duration if closed
  if (this.closedAt && this.createdAt) {
    const duration = Math.round((this.closedAt - this.createdAt) / (1000 * 60));
    this.durationMinutes = duration;
  }

  // Calculate resolution time if closed and acknowledged
  if (this.closedAt && this.acknowledgedAt) {
    const resolution = Math.round((this.closedAt - this.acknowledgedAt) / (1000 * 60));
    this.resolutionTimeMinutes = Math.max(0, resolution - (this.totalPausedMinutes || 0));
  }
  
  next();
});

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;

