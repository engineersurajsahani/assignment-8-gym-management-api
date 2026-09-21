const mongoose = require("mongoose");

const fitnessClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  trainerName: {
    type: String,
    required: true,
  },
  scheduleDate: {
    type: Date,
    required: true,
  },
  durationMinutes: {
    type: Number,
    default: 60,
  },
  maxCapacity: {
    type: Number,
    required: true,
  },
  enrolledMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("FitnessClass", fitnessClassSchema);
