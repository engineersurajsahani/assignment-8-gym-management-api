const mongoose = require("mongoose");
const User = require("../models/User");

const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

const renewMembership = async (request, response) => {
  try {
    const { id } = request.params;
    const { additionalMonths, tier } = request.body;

    if (!request.user._id.equals(id) && request.user.role !== "admin") {
      return response
        .status(403)
        .json({ message: "You can only renew your own membership!" });
    }

    const months = Number(additionalMonths);
    if (!Number.isInteger(months) || months < 1 || months > 24) {
      return response
        .status(400)
        .json({ message: "additionalMonths must be a whole number from 1 to 24!" });
    }

    if (tier !== undefined && !TIERS.includes(tier)) {
      return response
        .status(400)
        .json({ message: `tier must be one of: ${TIERS.join(", ")}` });
    }

    if (!mongoose.isValidObjectId(id)) {
      return response.status(404).json({ message: "Member not found!" });
    }

    const user = await User.findById(id);
    if (!user) {
      return response.status(404).json({ message: "Member not found!" });
    }

    user.extendMembership(months);
    if (tier) {
      user.membershipTier = tier;
    }
    await user.save();

    return response.status(200).json({
      message: "Membership renewed!",
      user,
      remainingDays: user.remainingDays,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const getExpiredMembers = async (request, response) => {
  try {
    const now = new Date();

    await User.updateMany(
      { membershipExpiryDate: { $lt: now }, membershipStatus: "active" },
      { $set: { membershipStatus: "expired" } },
    );

    const members = await User.find({ membershipExpiryDate: { $lt: now } }).sort({
      membershipExpiryDate: 1,
    });

    return response.status(200).json({ count: members.length, members });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

module.exports = { renewMembership, getExpiredMembers };
