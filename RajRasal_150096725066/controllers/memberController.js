const User = require('../models/User');

exports.renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier } = req.body;

    const months = parseInt(additionalMonths, 10);
    if (!months || months <= 0) {
      return res.status(400).json({
        success: false,
        message: 'additionalMonths must be a positive integer'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const currentExpiry = new Date(user.membershipExpiryDate);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + months * 30);

    user.membershipExpiryDate = newExpiry;
    user.membershipStatus = 'active';

    if (tier && ['Bronze', 'Silver', 'Gold', 'Platinum'].includes(tier)) {
      user.membershipTier = tier;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Membership renewed successfully',
      data: {
        id: user._id,
        username: user.username,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getExpiredMembers = async (req, res) => {
  try {
    const now = new Date();
    const expiredMembers = await User.find({
      $or: [
        { membershipExpiryDate: { $lt: now } },
        { membershipStatus: 'expired' }
      ]
    }).select('-password');

    res.status(200).json({
      success: true,
      count: expiredMembers.length,
      data: expiredMembers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
