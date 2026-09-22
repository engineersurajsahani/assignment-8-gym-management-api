// ------------------------------------------------------------------
// Seed script
//   npm run seed
//
// Loads sample members (data/users.json) and sample fitness classes
// (data/classes.json) so the API can be tested immediately.
// Run it again any time — it is idempotent: matching members/classes
// are removed first, then re-created with fresh data.
//
// Members are stored with bcrypt-hashed passwords. Membership expiry
// dates are computed automatically by the User pre('save') hook.
// ------------------------------------------------------------------
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const FitnessClass = require('../models/FitnessClass');
const usersData = require('./users.json');
const classesData = require('./classes.json');

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing. Copy .env.example to .env and set it.');
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    // ---- Seed members (idempotent) --------------------------------
    for (const u of usersData) {
      await User.deleteOne({ $or: [{ username: u.username }, { email: u.email }] });
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        username: u.username,
        email: u.email,
        password: hashedPassword,
        membershipTier: u.membershipTier || 'Bronze',
        membershipDurationMonths: u.durationMonths
      });
    }

    // ---- Seed fitness classes (idempotent) ------------------------
    for (const c of classesData) {
      await FitnessClass.deleteOne({ title: c.title, trainerName: c.trainerName });
      await FitnessClass.create({
        title: c.title,
        trainerName: c.trainerName,
        scheduleDate: new Date(c.scheduleDate),
        durationMinutes: c.durationMinutes || 60,
        maxCapacity: c.maxCapacity
      });
    }

    console.log(
      `Seeded ${usersData.length} members and ${classesData.length} fitness classes.`
    );
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

run();