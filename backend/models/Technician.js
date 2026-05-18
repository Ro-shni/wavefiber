import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{10}$/
  },
  block: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  onLeave: {
    type: Boolean,
    default: false
  },
  leaveStartDate: {
    type: Date
  },
  leaveEndDate: {
    type: Date
  },
  currentWorkload: {
    type: Number,
    default: 0
  },
  roundRobinIndex: {
    type: Number,
    default: 0
  },
  totalComplaintsHandled: {
    type: Number,
    default: 0
  },
  totalComplaintsClosed: {
    type: Number,
    default: 0
  },
  averageResolutionTime: {
    type: Number,
    default: 0
  },
  performanceScore: {
    type: Number,
    default: 100
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update leave status automatically
technicianSchema.pre('save', function(next) {
  const now = new Date();
  if (this.leaveStartDate && this.leaveEndDate) {
    if (now >= this.leaveStartDate && now <= this.leaveEndDate) {
      this.onLeave = true;
      this.isAvailable = false;
    } else if (now > this.leaveEndDate) {
      this.onLeave = false;
      this.isAvailable = true;
    }
  }
  next();
});

const Technician = mongoose.model('Technician', technicianSchema);

export default Technician;

