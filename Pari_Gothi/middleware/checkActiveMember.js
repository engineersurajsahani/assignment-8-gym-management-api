const User = require('../models/User');

// Middleware to ensure the member has an active and unexpired membership
const checkActiveMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in first.'
      });
    }

    // Refresh user from DB to get the latest membership status and expiry date
    const member = await User.findById(req.user._id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member account not found.'
      });
    }

    const now = new Date();
    const expiry = new Date(member.membershipExpiryDate);

    // Check if membership is expired or status is not active
    if (member.membershipStatus !== 'active' || expiry.getTime() < now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Membership is expired or inactive. Cannot book classes with an expired membership.'
      });
    }

    req.member = member;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error checking membership validity',
      error: error.message
    });
  }
};

module.exports = { checkActiveMember };
