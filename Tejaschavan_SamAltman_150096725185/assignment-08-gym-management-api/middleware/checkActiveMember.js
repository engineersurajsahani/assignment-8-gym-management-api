/**
 * Middleware to ensure the authenticated user's membership is active and not expired
 */
const checkActiveMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No active user session found'
    });
  }

  const now = new Date();
  const isExpiredByDate = new Date(req.user.membershipExpiryDate) < now;
  const isExpiredByStatus = req.user.membershipStatus === 'expired';
  const isFrozen = req.user.membershipStatus === 'frozen';

  if (isExpiredByDate || isExpiredByStatus) {
    return res.status(400).json({
      success: false,
      message: 'Membership expired. Please renew your membership to book classes.'
    });
  }

  if (isFrozen) {
    return res.status(400).json({
      success: false,
      message: 'Membership is currently frozen. Please contact gym administration.'
    });
  }

  next();
};

module.exports = checkActiveMember;
