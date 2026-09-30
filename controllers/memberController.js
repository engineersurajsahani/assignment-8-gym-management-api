const User = require('../models/User');

// Renew membership
const renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;

    if (!additionalMonths) {
      return res.status(400).json({
        message: 'additionalMonths is required'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'Member not found'
      });
    }

    const currentExpiry = new Date(user.membershipExpiryDate);
    const now = new Date();

    // If membership is already expired, start from today.
    // Otherwise, extend the existing expiry date.
    const startDate = currentExpiry > now ? currentExpiry : now;

    const newExpiryDate = new Date(startDate);
    newExpiryDate.setDate(
      newExpiryDate.getDate() + Number(additionalMonths) * 30
    );

    user.membershipExpiryDate = newExpiryDate;
    user.membershipStatus = 'active';

    if (tier) {
      user.membershipTier = tier;
    }

    await user.save();

    res.status(200).json({
      message: 'Membership renewed successfully',
      member: {
        id: user._id,
        username: user.username,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Membership renewal failed',
      error: error.message
    });
  }
};

// Get expired members
const getExpiredMembers = async (req, res) => {
  try {
    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: new Date() }
    });

    res.status(200).json(expiredMembers);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch expired members',
      error: error.message
    });
  }
};

module.exports = {
  renewMembership,
  getExpiredMembers
};