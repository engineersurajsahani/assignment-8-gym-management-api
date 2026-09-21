const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, trim: true },
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
    emergencyContact: { type: String, required: true, trim: true },
    enrolledClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FitnessClass",
      },
    ],
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
  },

  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
