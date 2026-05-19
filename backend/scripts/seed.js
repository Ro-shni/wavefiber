import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Technician from '../models/Technician.js';
import Complaint from '../models/Complaint.js';
import Settings from '../models/Settings.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Technician.deleteMany({});
    await Complaint.deleteMany({});
    await Settings.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create Manager
    const manager = await User.create({
      name: 'Roshni Manager',
      email: 'manager@tcn.com',
      phone: '9999999999',
      password: 'manager123',
      role: 'manager',
      address: 'TCN Office, Tanuku',
      block: 'HQ'
    });
    console.log('✅ Created Manager');

    // Create Staff
    const staff = await User.create({
      name: 'Uma Staff',
      email: 'staff@tcn.com',
      phone: '9888888888',
      password: 'staff123',
      role: 'staff',
      address: 'TCN Office, Tanuku',
      block: 'HQ'
    });
    console.log('✅ Created Staff');

    // Create Technicians
    const technicianData = [
      { name: 'M. Rambabu', email: 'rambabu@tcn.com', phone: '9876543201', block: 'B2' },
      { name: 'Naveen', email: 'naveen@tcn.com', phone: '9876543202', block: 'A1' },
      { name: 'Suresh', email: 'suresh@tcn.com', phone: '9876543203', block: 'B2' },
      { name: 'Ganesh', email: 'ganesh@tcn.com', phone: '9876543204', block: 'A1' },
      { name: 'Ravi Kumar', email: 'ravi@tcn.com', phone: '9876543205', block: 'C3' },
      { name: 'Srinivas', email: 'srinivas@tcn.com', phone: '9876543206', block: 'C3' },
    ];

    for (const tech of technicianData) {
      const user = await User.create({
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        password: 'tech123',
        role: 'technician',
        block: tech.block,
        isEmailVerified: true
      });

      await Technician.create({
        name: tech.name,
        phone: tech.phone,
        block: tech.block,
        userId: user._id,
        isAvailable: true,
        onLeave: false
      });
    }
    console.log('✅ Created 6 Technicians');

    // Create Sample Customers
    const customers = [];
    for (let i = 1; i <= 10; i++) {
      const customer = await User.create({
        name: `Customer ${i}`,
        email: `customer${i}@tcn.com`,
        phone: `987654${i.toString().padStart(4, '0')}`,
        password: 'customer123',
        role: 'customer',
        address: `House ${i}, Old Town, Tanuku`,
        block: ['A1', 'B2', 'C3'][i % 3],
        vcRId: `VC${1000 + i}`
      });
      customers.push(customer);
    }
    console.log('✅ Created 10 Sample Customers');

    // Create Sample Complaints
    const complaintTypes = ['NEWCONNECTION', 'NO SIGNAL', 'WIRE COMPLAINT', 'POWER COMPLAINT', 'Payment Issue'];
    const statuses = ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'CLOSED'];
    
    const technicians = await Technician.find();
    
    for (let i = 0; i < 20; i++) {
      const customer = customers[i % customers.length];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      
      const complaint = {
        customerId: customer._id,
        customerName: customer.name,
        phone: customer.phone,
        address: customer.address,
        block: customer.block,
        vcRId: customer.vcRId,
        complaintType: complaintTypes[i % complaintTypes.length],
        description: `Sample complaint description for ${complaintTypes[i % complaintTypes.length]}`,
        paymentStatus: ['PAID', 'UNPAID', 'N/A'][i % 3],
        status: status,
        priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
        createdAt: createdAt,
        callReceivedBy: staff.name
      };

      if (status !== 'OPEN') {
        // Assign technician for non-open complaints
        const blockTechnicians = technicians.filter(t => t.block === customer.block);
        if (blockTechnicians.length > 0) {
          const assignedTech = blockTechnicians[i % blockTechnicians.length];
          complaint.technicianId = assignedTech._id;
          complaint.technicianName = assignedTech.name;
          complaint.assignedAt = new Date(createdAt.getTime() + 10 * 60 * 1000); // 10 mins after creation
        }
      }

      if (status === 'IN PROGRESS' || status === 'CLOSED') {
        complaint.acknowledgedAt = new Date(complaint.assignedAt.getTime() + 5 * 60 * 1000); // 5 mins after assignment
      }

      if (status === 'CLOSED') {
        const resolutionTime = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
        complaint.closedAt = new Date(complaint.acknowledgedAt.getTime() + resolutionTime * 60 * 1000);
        complaint.technicianFeedback = 'Issue resolved successfully';
        complaint.usedMaterial = ['Cable', 'Connector', 'Splitter', 'None'][i % 4];
        complaint.remarks = 'Customer satisfied';
      }

      await Complaint.create(complaint);
    }
    console.log('✅ Created 20 Sample Complaints');

    // Create Settings
    await Settings.create({
      autoAssignEnabled: true
    });
    console.log('✅ Created Settings');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Manager: phone: 9999999999 / password: manager123');
    console.log('Staff: phone: 9888888888 / password: staff123');
    console.log('Technician (Rambabu): email: rambabu@tcn.com / password: tech123');
    console.log('Customer: phone: 9876540001 to 9876540010 / password: customer123');
    console.log('\nAll Technician Emails: rambabu@tcn.com, naveen@tcn.com, suresh@tcn.com, ganesh@tcn.com, ravi@tcn.com, srinivas@tcn.com');
    
    // process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    throw error;
  }
};

export default seedData;

