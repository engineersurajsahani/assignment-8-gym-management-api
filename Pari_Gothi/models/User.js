const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'], 
    unique: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'] 
  },
  membershipTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'expired', 'frozen'],
    default: 'active'
  },
  membershipExpiryDate: { 
    type: Date, 
    required: [true, 'Membership expiry date is required'] 
  },
  emergencyContact: { 
    type: String,
    trim: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Helper static method to calculate expiry date based on standard 30-day billing cycle (test compliant)
userSchema.statics.calculateExpiryDate = function (baseDate = new Date(), durationMonths = 1) {
  const months = Number(durationMonths) || 1;
  const start = new Date(baseDate);
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return new Date(start.getTime() + (months * thirtyDaysInMs));
};

// Instance method to calculate remaining days until membership expires
userSchema.methods.getRemainingDays = function () {
  if (!this.membershipExpiryDate) return 0;
  const now = new Date();
  const diffTime = new Date(this.membershipExpiryDate).getTime() - now.getTime();
  if (diffTime <= 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Pre-save hook: auto-sync membershipStatus based on membershipExpiryDate if not frozen
userSchema.pre('save', function (next) {
  if (this.membershipStatus !== 'frozen' && this.membershipExpiryDate) {
    const isPast = new Date(this.membershipExpiryDate).getTime() < Date.now();
    if (isPast && this.membershipStatus === 'active') {
      this.membershipStatus = 'expired';
    } else if (!isPast && this.membershipStatus === 'expired') {
      this.membershipStatus = 'active';
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
