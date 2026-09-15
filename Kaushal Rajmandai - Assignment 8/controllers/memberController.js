const User = require('../models/User');

// PATCH /api/members/:id/renew
const renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;

    if (!additionalMonths) {
      return res.status(400).json({ message: 'additionalMonths is required.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    // Extend from the later of "now" or the current expiry date
    const baseDate = user.membershipExpiryDate > new Date() ? user.membershipExpiryDate : new Date();
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + Number(additionalMonths));

    user.membershipExpiryDate = newExpiryDate;
    user.membershipStatus = 'active';
    if (tier) user.membershipTier = tier;

    await user.save();

    res.status(200).json({
      message: 'Membership renewed successfully.',
      user: {
        id: user._id,
        username: user.username,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/members/expired
const getExpiredMembers = async (req, res) => {
  try {
    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: new Date() }
    }).select('-password');

    res.status(200).json(expiredMembers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { renewMembership, getExpiredMembers };