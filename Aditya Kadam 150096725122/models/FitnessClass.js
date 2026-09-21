const mongoose = require('mongoose');

const fitnessClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  trainerName: {
    type: String,
    required: true,
    trim: true
  },
  scheduleDate: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 15,
    max: 180
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  enrolledMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

fitnessClassSchema.virtual('availableSpots').get(function() {
  return this.maxCapacity - this.enrolledMembers.length;
});

fitnessClassSchema.methods.isFull = function() {
  return this.enrolledMembers.length >= this.maxCapacity;
};

fitnessClassSchema.methods.isMemberEnrolled = function(userId) {
  return this.enrolledMembers.some(id => id.toString() === userId.toString());
};

fitnessClassSchema.set('toJSON', { virtuals: true });
fitnessClassSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FitnessClass', fitnessClassSchema);
