const User = require('../models/User');

const renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;

    if (!Number.isInteger(Number(additionalMonths)) || Number(additionalMonths) <= 0) {
      return res.status(400).json({ message: 'additionalMonths must be a positive integer' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const now = new Date();
    let baseDate = new Date(user.membershipExpiryDate);

    if (baseDate < now) {
      baseDate = now;
    }

    baseDate.setDate(baseDate.getDate() + Number(additionalMonths) * 30);

    user.membershipExpiryDate = baseDate;
    user.membershipStatus = 'active';

    if (tier) {
      if (!['Bronze', 'Silver', 'Gold', 'Platinum'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid membership tier' });
      }
      user.membershipTier = tier;
    }

    await user.save();

    res.status(200).json({
      message: 'Membership renewed successfully',
      user: {
        id: user._id,
        username: user.username,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Renewal failed', error: error.message });
  }
};

const getExpiredMembers = async (req, res) => {
  try {
    const members = await User.find({
      membershipExpiryDate: { $lt: new Date() }
    }).select('-password');

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({
      message: 'Could not fetch expired memberships',
      error: error.message
    });
  }
};

module.exports = { renewMembership, getExpiredMembers };
