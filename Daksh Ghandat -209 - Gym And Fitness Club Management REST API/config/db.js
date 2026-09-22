const mongoose = require('mongoose');

// ------------------------------------------------------------------
// connectDB
// Connects this application to MongoDB using the MONGODB_URI value
// from the .env file. The URI comes from the environment, never from
// hard-coded source code.
// ------------------------------------------------------------------
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Setting this option adds extra safety in development.
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit the process with a failure code so the developer knows
    // the database is required for the server to behave correctly.
    process.exit(1);
  }
};

module.exports = connectDB;