import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  autoAssignEnabled: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

