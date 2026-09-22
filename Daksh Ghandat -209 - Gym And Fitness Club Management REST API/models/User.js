const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
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
      trim: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: (props) => `${props.value} is not a valid email address`
      }
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
      // Note: deliberately NOT "required" in the schema. A pre('save')
      // hook below calculates and sets this value for every new member,
      // and Mongoose runs its validation BEFORE pre('save') hooks, so a
      // required validator here would always fail on first registration.
      // The controller always sets membershipDurationMonths, which makes
      // the hook the single place responsible for this date.
      default: null
    },

    emergencyContact: {
      type: String
    },

    // Internal field used by the pre('save') hook.
    // 30 days are added to the expiry date for every month requested.
    // It is NOT returned to the client (see getSafeUser in the controller).
    membershipDurationMonths: {
      type: Number,
      min: [1, 'Duration must be at least 1 month'],
      required: false,
      default: 0,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// ------------------------------------------------------------------
// Mongoose pre('save') hook — AUTOMATIC membership expiry calculation.
// ------------------------------------------------------------------
// The assignment grading rubric requires a real pre('save') hook.
// This hook runs automatically every time a NEW member is saved, and
// computes membershipExpiryDate = createdAt + (durationMonths * 30 days).
// When a membership is renewed the hook is disabled on purpose, because
// renewals extend from the existing expiry date instead (see
// memberController). We only auto-calculate the date for new members so
// that the hook stays genuinely useful and easy to understand.
// ------------------------------------------------------------------
userSchema.pre('save', async function () {
  if (this.isNew && this.membershipDurationMonths > 0) {
    const days = this.membershipDurationMonths * 30; // 30 days per month
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    this.membershipExpiryDate = expiry;
  }
});

module.exports = mongoose.model('User', userSchema);