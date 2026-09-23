const User = require('../models/User');

exports.renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const monthsToAdd = additionalMonths || 1;
    const now = new Date();
    let baseDate = user.membershipExpiryDate && new Date(user.membershipExpiryDate) > now 
      ? new Date(user.membershipExpiryDate) 
      : now;

    baseDate.setDate(baseDate.getDate() + (30 * monthsToAdd));
    user.membershipExpiryDate = baseDate;
    user.membershipStatus = 'active';

    if (tier) {
      user.membershipTier = tier;
    }

    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ message: 'Membership renewed successfully', user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpiredMembers = async (req, res) => {
  try {
    const now = new Date();
    const expiredMembers = await User.find({ membershipExpiryDate: { $lt: now } }).select('-password');
    res.status(200).json(expiredMembers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};