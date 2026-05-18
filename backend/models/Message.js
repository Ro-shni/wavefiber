import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    enum: ['customer', 'technician', 'staff', 'manager'],
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  // Voice message support
  voiceUrl: {
    type: String,
    default: null
  },
  voiceDuration: {
    type: Number,
    default: 0
  },
  messageType: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient chat queries
messageSchema.index({ complaintId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
