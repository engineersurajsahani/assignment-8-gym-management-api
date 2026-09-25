const User = require('../models/User');

const renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;

    if (!additionalMonths || Number(additionalMonths) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'additionalMonths must be a positive number',
      });
    }

    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const now = new Date();
    const baseDate =
      member.membershipExpiryDate && member.membershipExpiryDate > now
        ? new Date(member.membershipExpiryDate)
        : now;

    baseDate.setMonth(baseDate.getMonth() + Number(additionalMonths));
    member.membershipExpiryDate = baseDate;
    member.membershipStatus = 'active';

    if (tier) {
      member.membershipTier = tier;
    }

    await member.save();

    return res.status(200).json({
      success: true,
      message: 'Membership renewed successfully',
      data: member.toSafeObject(),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getExpiredMembers = async (req, res) => {
  try {
    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: new Date() },
    }).select('-password');

    return res.status(200).json({
      success: true,
      count: expiredMembers.length,
      data: expiredMembers,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { renewMembership, getExpiredMembers };
