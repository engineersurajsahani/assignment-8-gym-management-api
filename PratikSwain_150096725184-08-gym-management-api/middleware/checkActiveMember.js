const User = require('../models/User');

// Middleware to verify if authenticated member has an active, non-expired membership
const checkActiveMember = async (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please log in first.'
    });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Member not found.'
      });
    }

    const now = new Date();
    const isDateExpired = new Date(user.membershipExpiryDate) < now;

    if (user.membershipStatus === 'expired' || isDateExpired) {
      // Synchronize membership status if date has passed
      if (user.membershipStatus !== 'expired') {
        user.membershipStatus = 'expired';
        await user.save();
      }
      return res.status(400).json({
        success: false,
        message: 'Membership has expired. Please renew your membership to book classes.'
      });
    }

    if (user.membershipStatus === 'frozen') {
      return res.status(400).json({
        success: false,
        message: 'Membership is currently frozen. Please contact administration.'
      });
    }

    // Attach up-to-date user instance
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying membership status',
      error: err.message
    });
  }
};

module.exports = { checkActiveMember };
