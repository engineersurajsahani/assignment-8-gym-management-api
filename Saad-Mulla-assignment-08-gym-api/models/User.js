const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
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
  membershipExpiryDate: { type: Date, required: true },
  emergencyContact: { type: String }
}, { timestamps: true });

userSchema.pre('save', function(next) {
  if (this.membershipExpiryDate && new Date(this.membershipExpiryDate) < new Date()) {
    this.membershipStatus = 'expired';
  } else if (this.membershipExpiryDate && new Date(this.membershipExpiryDate) >= new Date() && this.membershipStatus === 'expired') {
    this.membershipStatus = 'active';
  }
  next();
});

module.exports = mongoose.model('User', userSchema);