const mongoose = require('mongoose');

const fitnessClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Class title is required'],
      trim: true
    },
    trainerName: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true
    },
    scheduleDate: {
      type: Date,
      required: [true, 'Schedule date is required']
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      default: 60,
      min: [1, 'Duration must be at least 1 minute']
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: [1, 'Maximum capacity must be at least 1']
    },
    enrolledMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Virtual property to calculate available seats
fitnessClassSchema.virtual('availableSeats').get(function () {
  return this.maxCapacity - (this.enrolledMembers ? this.enrolledMembers.length : 0);
});

fitnessClassSchema.set('toJSON', { virtuals: true });
fitnessClassSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FitnessClass', fitnessClassSchema);
