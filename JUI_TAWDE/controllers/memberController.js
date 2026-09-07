const User = require('../models/User');

exports.renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;

    if (!Number.isInteger(Number(additionalMonths)) || Number(additionalMonths) < 1) {
      return res.status(400).json({
        message: 'additionalMonths must be a positive integer.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found.' });

    const now = new Date();
    const base = user.membershipExpiryDate > now
      ? new Date(user.membershipExpiryDate)
      : now;

    base.setDate(base.getDate() + Number(additionalMonths) * 30);

    user.membershipExpiryDate = base;
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
    res.status(400).json({
      message: 'Membership renewal failed.',
      error: error.message
    });
  }
};

exports.getExpiredMembers = async (req, res) => {
  try {
    const members = await User.find({
      membershipExpiryDate: { $lt: new Date() }
    }).select('-password');

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch expired memberships.',
      error: error.message
    });
  }
};
