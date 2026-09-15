const User = require('../models/User');

// Renew / extend membership expiry date & tier
const renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const monthsToAdd = parseInt(additionalMonths) > 0 ? parseInt(additionalMonths) : 1;
    const now = new Date();
    const currentExpiry = new Date(user.membershipExpiryDate);

    // If membership is currently active and not expired, add to current expiry date;
    // otherwise start from today
    let baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + monthsToAdd);

    user.membershipExpiryDate = newExpiryDate;
    user.membershipStatus = 'active';

    if (tier && ['Bronze', 'Silver', 'Gold', 'Platinum'].includes(tier)) {
      user.membershipTier = tier;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      message: 'Membership renewed successfully.',
      user: userObj
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Member not found.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

// Get list of all expired memberships
const getExpiredMembers = async (req, res) => {
  try {
    const now = new Date();

    // Mark any active users whose expiry date has passed as 'expired'
    await User.updateMany(
      { membershipExpiryDate: { $lt: now }, membershipStatus: 'active' },
      { $set: { membershipStatus: 'expired' } }
    );

    const expiredMembers = await User.find({
      $or: [
        { membershipExpiryDate: { $lt: now } },
        { membershipStatus: 'expired' }
      ]
    }).select('-password').sort({ membershipExpiryDate: -1 });

    return res.status(200).json({
      count: expiredMembers.length,
      expiredMembers
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  renewMembership,
  getExpiredMembers
};
