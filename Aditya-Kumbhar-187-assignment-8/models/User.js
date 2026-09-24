const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    membershipTier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
    membershipStatus: {
      type: String,
      enum: ["active", "expired", "frozen"],
      default: "active",
    },
    membershipExpiryDate: { type: Date, required: true },
    emergencyContact: { type: String },
  },
  { timestamps: true }
);

// this hook auto calculates the expiry date when a new member registers
// durationMonths is passed in from the controller, its not a schema field
// runs on "validate" (not "save") so it fills the field before the required check happens
userSchema.pre("validate", function (next) {
  if (this.isNew && !this.membershipExpiryDate) {
    const months = this.durationMonths || 1;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    this.membershipExpiryDate = expiryDate;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
