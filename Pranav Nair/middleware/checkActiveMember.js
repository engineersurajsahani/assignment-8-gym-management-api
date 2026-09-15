const User = require('../models/User');

/**
 * Ensures the authenticated member has an active (non-expired) membership.
 * Also auto-updates status if the expiry date has passed.
 */
const checkActiveMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Member not found.',
      });
    }

    // Auto-expire if past expiry date
    if (user.membershipStatus === 'active' && user.membershipExpiryDate < new Date()) {
      user.membershipStatus = 'expired';
      await user.save();
    }

    if (user.membershipStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Membership is ${user.membershipStatus}. Please renew to access classes.`,
      });
    }

    // Attach refreshed user to request
    req.member = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkActiveMember };
