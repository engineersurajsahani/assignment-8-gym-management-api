/**
 * Blocks class booking if the logged-in member's membership is expired.
 * Must run after authMiddleware (needs req.user).
 * Re-checks against the live date rather than trusting a possibly stale
 * membershipStatus field.
 */
function checkActiveMember(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false, message: 'You must be logged in to perform this action' });
  }

  if (user.membershipStatus === 'frozen') {
    return res.status(400).json({ success: false, message: 'Your membership is currently frozen' });
  }

  const isExpired = !user.membershipExpiryDate || user.membershipExpiryDate < new Date();
  if (isExpired) {
    return res.status(400).json({
      success: false,
      message: 'Your membership has expired. Please renew to book classes.'
    });
  }

  next();
}

module.exports = checkActiveMember;
