const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    membershipTier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze',
    },

    membershipStatus: {
      type: String,
      enum: ['active', 'expired', 'frozen'],
      default: 'active',
    },

    membershipDurationMonths: {
      type: Number,
      min: 1,
      default: 1,
    },

    membershipExpiryDate: {
      type: Date,
    },

    emergencyContact: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
  Mongoose pre-save hook:
  Automatically calculate membership expiry date
  for a new member.

  1 month = 30 days.
*/
userSchema.pre('save', async function (next) {
  try {
    // Hash password if it has been changed
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    // Calculate expiry date for a new member
    if (this.isNew && !this.membershipExpiryDate) {
      const expiryDate = new Date();

      expiryDate.setDate(
        expiryDate.getDate() +
          this.membershipDurationMonths * 30
      );

      this.membershipExpiryDate = expiryDate;
    }

    // Automatically mark expired memberships
    if (
      this.membershipExpiryDate &&
      this.membershipExpiryDate < new Date() &&
      this.membershipStatus === 'active'
    ) {
      this.membershipStatus = 'expired';
    }

    next();
  } catch (error) {
    next(error);
  }
});

/*
  Compare login password with hashed password.
*/
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);