const mongoose = require("mongoose");

const fitnessClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    trainerName: { type: String, required: true },
    scheduleDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    maxCapacity: { type: Number, required: true, min: 1 },
    enrolledMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

fitnessClassSchema.virtual("seatsLeft").get(function () {
  return Math.max(0, this.maxCapacity - this.enrolledMembers.length);
});

fitnessClassSchema.virtual("endTime").get(function () {
  if (!this.scheduleDate) return null;
  return new Date(this.scheduleDate.getTime() + this.durationMinutes * 60 * 1000);
});

fitnessClassSchema.pre("validate", function () {
  if (this.isNew && this.scheduleDate && this.scheduleDate.getTime() < Date.now()) {
    this.invalidate("scheduleDate", "scheduleDate must be in the future");
  }
  if (this.enrolledMembers.length > this.maxCapacity) {
    this.invalidate("maxCapacity", "maxCapacity cannot be less than enrolled members");
  }
});

fitnessClassSchema.set("toJSON", { virtuals: true, versionKey: false });

const FitnessClass = mongoose.model("FitnessClass", fitnessClassSchema); //because of PascalCase...irritating bug..
module.exports = FitnessClass;
