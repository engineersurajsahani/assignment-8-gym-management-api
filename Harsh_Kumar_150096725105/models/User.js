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

// Middleware to update membershipStatus before sending docs (optional)
// But we'll manage it dynamically where needed.

module.exports = mongoose.model('User', userSchema);
