const User = require('../models/User');

// PATCH /api/members/:id/renew
// Body: { additionalMonths: 6, tier: "Platinum" }
const renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier } = req.body;

    const months = Number(additionalMonths);
    if (!additionalMonths || isNaN(months) || months <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive number for additionalMonths.'
      });
    }

    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found.'
      });
    }

    const now = new Date();
    const currentExpiry = new Date(member.membershipExpiryDate);
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const extensionMs = months * thirtyDaysInMs;

    // If current membership is still active in the future, extend from current expiry;
    // If already expired, extend from today's date
    let newExpiry;
    if (currentExpiry.getTime() > now.getTime()) {
      newExpiry = new Date(currentExpiry.getTime() + extensionMs);
    } else {
      newExpiry = new Date(now.getTime() + extensionMs);
    }

    member.membershipExpiryDate = newExpiry;
    member.membershipStatus = 'active';

    if (tier) {
      const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({
          success: false,
          message: `Invalid membership tier. Allowed tiers: ${validTiers.join(', ')}`
        });
      }
      member.membershipTier = tier;
    }

    await member.save();

    return res.status(200).json({
      success: true,
      message: `Membership successfully renewed for ${months} month(s).`,
      data: {
        _id: member._id,
        username: member.username,
        email: member.email,
        membershipTier: member.membershipTier,
        membershipStatus: member.membershipStatus,
        membershipExpiryDate: member.membershipExpiryDate,
        remainingDays: member.getRemainingDays()
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to renew membership.'
    });
  }
};

// GET /api/members/expired
// Returns all members whose membershipExpiryDate is strictly before the current date/time
const getExpiredMembers = async (req, res) => {
  try {
    const now = new Date();
    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: now }
    }).select('-password');

    return res.status(200).json({
      success: true,
      count: expiredMembers.length,
      data: expiredMembers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve expired members.',
      error: error.message
    });
  }
};

module.exports = {
  renewMembership,
  getExpiredMembers
};
