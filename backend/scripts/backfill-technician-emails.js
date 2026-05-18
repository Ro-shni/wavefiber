/**
 * One-time migration script to backfill email field on existing Technician records.
 * Pulls the email from the linked User document.
 *
 * Usage:  node scripts/backfill-technician-emails.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Technician from '../models/Technician.js';
import User from '../models/User.js';

dotenv.config();

async function backfill() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const technicians = await Technician.find({ $or: [{ email: null }, { email: { $exists: false } }] });
  console.log(`Found ${technicians.length} technician(s) without email`);

  for (const tech of technicians) {
    const user = await User.findById(tech.userId);
    if (user?.email) {
      tech.email = user.email;
      await tech.save();
      console.log(`  Updated ${tech.name} -> ${user.email}`);
    } else {
      console.log(`  SKIPPED ${tech.name} (no linked user or user has no email)`);
    }
  }

  console.log('Done.');
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
