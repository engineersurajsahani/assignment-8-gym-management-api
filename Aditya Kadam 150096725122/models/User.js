const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
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
    required: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getRemainingDays = function() {
  const now = new Date();
  const diff = this.membershipExpiryDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

userSchema.methods.checkAndUpdateExpiry = function() {
  if (this.membershipStatus === 'active' && new Date() > this.membershipExpiryDate) {
    this.membershipStatus = 'expired';
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
