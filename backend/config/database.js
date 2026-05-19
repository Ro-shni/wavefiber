import mongoose from 'mongoose';
import seedData from '../scripts/seed.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/WaveFiber';
    console.log(`⏳ Connecting to MongoDB at ${mongoUri}...`);
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Seed database if empty
    const User = (await import('../models/User.js')).default;
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Seeding initial data...');
      await seedData();
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('\n💡 Tip: Make sure MongoDB is installed and running on your system.');
    process.exit(1);
  }
};

export default connectDB;
