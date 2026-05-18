import Technician from '../models/Technician.js';
import Settings from '../models/Settings.js';
import LeaveRequest from '../models/LeaveRequest.js';

export const assignTechnicianToComplaint = async (complaint) => {
  try {
    // Check if auto-assignment is enabled
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ autoAssignEnabled: true });
    }

    if (!settings.autoAssignEnabled) {
      console.log('Auto-assignment is disabled');
      return null;
    }

    // Find available technicians in the same block
    const availableTechnicians = await Technician.find({
      block: complaint.block,
      isAvailable: true,
      onLeave: false
    }).sort({ roundRobinIndex: 1, currentWorkload: 1 });

    // Filter out technicians with approved active leaves
    const now = new Date();
    const techsWithoutActiveLeave = [];
    
    for (const tech of availableTechnicians) {
      const activeLeave = await LeaveRequest.findOne({
        technicianId: tech._id,
        status: 'APPROVED',
        startDateTime: { $lte: now },
        endDateTime: { $gte: now }
      });
      
      if (!activeLeave) {
        techsWithoutActiveLeave.push(tech);
      }
    }

    if (techsWithoutActiveLeave.length === 0) {
      console.log(`No available technicians found for block ${complaint.block}`);
      return null;
    }

    // Select technician using round-robin from available ones
    const selectedTechnician = techsWithoutActiveLeave[0];


    // Assign complaint to technician
    complaint.technicianId = selectedTechnician._id;
    complaint.technicianName = selectedTechnician.name;
    complaint.status = 'ASSIGNED';
    complaint.assignedAt = new Date();
    await complaint.save();

    // Update technician stats
    selectedTechnician.currentWorkload += 1;
    selectedTechnician.totalComplaintsHandled += 1;
    selectedTechnician.roundRobinIndex += techsWithoutActiveLeave.length;
    await selectedTechnician.save();

    console.log(`Complaint ${complaint._id} assigned to ${selectedTechnician.name}`);
    return selectedTechnician;

  } catch (error) {
    console.error('Error in assignTechnicianToComplaint:', error);
    return null;
  }
};

