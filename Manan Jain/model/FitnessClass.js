const mongoose = require("mongoose");

const fitnessClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Class title is required"],
      trim: true
    },
    trainerName: {
      type: String,
      required: [true, "Trainer name is required"],
      trim: true
    },
    scheduleDate: {
      type: Date,
      required: [true, "Schedule date is required"]
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration in minutes is required"],
      default: 60,
      min: [1, "Duration must be at least 1 minute"]
    },
    maxCapacity: {
      type: Number,
      required: [true, "Max capacity is required"],
      min: [1, "Max capacity must be at least 1"]
    },
    enrolledMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

const FitnessClass = mongoose.model("FitnessClass", fitnessClassSchema);

module.exports = FitnessClass;
