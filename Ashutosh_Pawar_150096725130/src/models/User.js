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

const DAY_MS = 24 * 60 * 60 * 1000;

userSchema.virtual("remainingDays").get(function () {
  if (!this.membershipExpiryDate) return undefined;
  const diff = this.membershipExpiryDate.getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / DAY_MS) : 0;
});

userSchema.methods.isExpired = function () {
  return this.membershipExpiryDate.getTime() < Date.now();
};

userSchema.methods.extendMembership = function (months) {
  const base = this.isExpired() ? Date.now() : this.membershipExpiryDate.getTime();
  this.membershipExpiryDate = new Date(base + months * 30 * DAY_MS);
  this.membershipStatus = "active";
};

userSchema.pre("save", function () {
  if (this.membershipStatus === "active" && this.isExpired()) {
    this.membershipStatus = "expired";
  }
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
