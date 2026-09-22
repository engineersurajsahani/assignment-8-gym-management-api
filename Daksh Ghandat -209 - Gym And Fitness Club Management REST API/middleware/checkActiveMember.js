// ------------------------------------------------------------------
// checkActiveMember
// Used for class booking. Makes sure the logged-in member actually
// holds a valid, active membership before they can enroll.
//
// 1. Must be authenticated (re-uses authMiddleware behaviour).
// 2. If membershipExpiryDate is in the past -> mark member as
//    "expired", save, and reject the booking.
// 3. If membershipStatus is "frozen" -> reject the booking.
// 4. Otherwise the membership is active, so call next().
// ------------------------------------------------------------------
module.exports = async function checkActiveMember(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const user = req.user;

  // ---- Expired membership -----------------------------------------
  if (user.membershipExpiryDate < new Date()) {
    if (user.membershipStatus !== 'expired') {
      // Keep the stored status in sync with reality.
      user.membershipStatus = 'expired';
      await user.save();
    }
    return res.status(400).json({ message: 'Membership has expired' });
  }

  // ---- Frozen membership ------------------------------------------
  if (user.membershipStatus === 'frozen') {
    return res.status(400).json({ message: 'Membership is frozen' });
  }

  return next();
};