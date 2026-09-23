const User = require("../model/User");

/**
 * Middleware to check if the authenticated user has an active membership
 */
const checkActiveMember = async (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const user = req.user;

    // Check if membership expiry date is in the past
    const now = new Date();
    if (user.membershipExpiryDate < now) {
      // If expired but status is still active, update status to expired
      if (user.membershipStatus !== "expired") {
        user.membershipStatus = "expired";
        await user.save();
      }

      return res.status(403).json({
        success: false,
        message: "Your membership has expired. Please renew to book classes."
      });
    }

    // Check if membership status is strictly active
    if (user.membershipStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: `Your membership is currently ${user.membershipStatus}. Only active members can book classes.`
      });
    }

    // Passed all checks, user is active
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error during membership check"
    });
  }
};

module.exports = checkActiveMember;
