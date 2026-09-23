const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Accurately add months to a given date handling month-end edge cases
 */
const addMonths = (startDate, months) => {
  const date = new Date(startDate);
  const targetMonth = date.getMonth() + Number(months);
  const originalDay = date.getDate();
  date.setMonth(targetMonth);
  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }
  return date;
};

// @desc    Renew member membership
// @route   PATCH /api/members/:id/renew
// @access  Private / Public
exports.renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier, membershipTier } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID format'
      });
    }

    const months = parseInt(additionalMonths, 10);
    if (isNaN(months) || months < 1) {
      return res.status(400).json({
        success: false,
        message: 'additionalMonths is required and must be an integer greater than or equal to 1'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Extend from whichever is later: now or current expiry
    const now = new Date();
    const currentExpiry = new Date(user.membershipExpiryDate);
    const baseDate = currentExpiry > now ? currentExpiry : now;

    user.membershipExpiryDate = addMonths(baseDate, months);
    user.membershipStatus = 'active';

    // Update tier if provided
    const newTier = tier || membershipTier;
    if (newTier) {
      const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      if (!validTiers.includes(newTier)) {
        return res.status(400).json({
          success: false,
          message: `Invalid membershipTier. Must be one of: ${validTiers.join(', ')}`
        });
      }
      user.membershipTier = newTier;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Membership renewed successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error renewing membership'
    });
  }
};

// @desc    Get all expired members and self-heal their membershipStatus
// @route   GET /api/members/expired
// @access  Public / Private
exports.getExpiredMembers = async (req, res) => {
  try {
    const now = new Date();

    // Self-healing: flip status to 'expired' for any users whose expiry date is in the past but status is not 'expired'
    await User.updateMany(
      {
        membershipExpiryDate: { $lt: now },
        membershipStatus: { $ne: 'expired' }
      },
      {
        $set: { membershipStatus: 'expired' }
      }
    );

    // Retrieve all expired users
    const expiredUsers = await User.find({
      membershipExpiryDate: { $lt: now }
    }).select('-password').sort({ membershipExpiryDate: -1 });

    res.status(200).json({
      success: true,
      count: expiredUsers.length,
      data: expiredUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching expired members'
    });
  }
};

// @desc    Get all members (optional filter by tier or status)
// @route   GET /api/members
// @access  Public / Private
exports.getAllMembers = async (req, res) => {
  try {
    const { tier, status } = req.query;
    const filter = {};

    if (tier) filter.membershipTier = tier;
    if (status) filter.membershipStatus = status;

    const members = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching members'
    });
  }
};
