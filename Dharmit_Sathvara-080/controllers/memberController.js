const User = require('../models/User');

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

exports.renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;
    const months = Number(additionalMonths);

    if (!Number.isInteger(months) || months < 1) {
      return res.status(400).json({ message: 'additionalMonths must be a positive integer' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    const baseDate = new Date(user.membershipExpiryDate) > new Date() ? new Date(user.membershipExpiryDate) : new Date();
    user.membershipExpiryDate = addMonths(baseDate, months);
    user.membershipStatus = 'active';
    if (tier) user.membershipTier = tier;

    await user.save();
    res.status(200).json({ message: 'Membership renewed successfully', user: user.toSafeObject() });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Membership renewal failed', error: error.message });
  }
};

exports.getExpiredMembers = async (req, res) => {
  try {
    const expiredMembers = await User.find({ membershipExpiryDate: { $lt: new Date() } }).select('-password').sort({ membershipExpiryDate: 1 });
    res.status(200).json(expiredMembers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expired memberships', error: error.message });
  }
};
