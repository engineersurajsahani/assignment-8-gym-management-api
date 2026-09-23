// middleware/checkActiveMember.js
const checkActiveMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const now = new Date();
  const expiryDate = new Date(req.user.membershipExpiryDate);

  if (req.user.membershipStatus !== 'active' || expiryDate <= now) {
    return res.status(400).json({
      success: false,
      message: 'Access Denied: Your gym membership is expired or inactive. Please renew your membership.'
    });
  }

  next();
};

module.exports = checkActiveMember;
