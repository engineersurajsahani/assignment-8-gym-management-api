const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

// Keep membershipStatus in sync with the expiry date on every save,
// unless it's been explicitly frozen (frozen is a manual admin action
// that shouldn't be silently overwritten by the date check).
userSchema.pre('save', function (next) {
  if (this.membershipStatus !== 'frozen') {
    this.membershipStatus = this.membershipExpiryDate && this.membershipExpiryDate < new Date()
      ? 'expired'
      : 'active';
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
