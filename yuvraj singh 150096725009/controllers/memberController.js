const User = require('../models/User');

// @desc    Renew or extend membership expiry date
// @route   PATCH /api/members/:id/renew
// @access  Private
exports.renewMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier } = req.body;

    const months = parseInt(additionalMonths, 10);
    if (isNaN(months) || months <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a positive integer for additionalMonths.'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Member not found with ID ${id}`
      });
    }

    const now = new Date();
    let baseDate = new Date(user.membershipExpiryDate);

    // If currently expired or invalid, renew from today; otherwise extend existing expiry date
    if (baseDate < now || isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }

    // Add 30 days per additional month
    baseDate.setDate(baseDate.getDate() + months * 30);
    user.membershipExpiryDate = baseDate;
    user.membershipStatus = 'active';

    if (tier) {
      const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({
          success: false,
          message: `Invalid tier. Allowed values: ${validTiers.join(', ')}`
        });
      }
      user.membershipTier = tier;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Membership renewed successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        remainingDays: user.getRemainingDays()
      }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: `Member not found with ID ${req.params.id}`
      });
    }
    next(error);
  }
};

// @desc    Get list of all expired memberships
// @route   GET /api/members/expired
// @access  Private / Public
exports.getExpiredMembers = async (req, res, next) => {
  try {
    const now = new Date();

    const expiredMembers = await User.find({
      $or: [
        { membershipExpiryDate: { $lt: now } },
        { membershipStatus: 'expired' }
      ]
    }).select('-password');

    return res.status(200).json({
      success: true,
      count: expiredMembers.length,
      data: expiredMembers
    });
  } catch (error) {
    next(error);
  }
};
