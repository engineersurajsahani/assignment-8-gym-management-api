const User = require("../models/User");

// renew / extend a members plan
exports.renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }

    // if plan already expired, start counting from today instead of the old date
    const baseDate = user.membershipExpiryDate > new Date() ? user.membershipExpiryDate : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + (additionalMonths || 1));

    user.membershipExpiryDate = newExpiry;
    user.membershipStatus = "active";

    if (tier) {
      user.membershipTier = tier;
    }

    await user.save();

    res.status(200).json({ message: "Membership renewed", user });
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};

// list every member whose membership has expired
exports.getExpiredMembers = async (req, res) => {
  try {
    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: new Date() },
    });

    res.status(200).json(expiredMembers);
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};
