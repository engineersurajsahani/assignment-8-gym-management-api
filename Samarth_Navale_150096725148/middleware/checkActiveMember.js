const checkActiveMember = (req, res, next) => {
  const usr = req.user;

  if (!usr) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const isExpired = new Date(usr.membershipExpiryDate) < new Date() || usr.membershipStatus === 'expired';

  if (isExpired) {
    return res.status(400).json({
      success: false,
      message: 'Membership has expired. Please renew to book classes.'
    });
  }

  if (usr.membershipStatus === 'frozen') {
    return res.status(400).json({
      success: false,
      message: 'Membership is frozen. Please unfreeze to book classes.'
    });
  }

  next();
};

module.exports = checkActiveMember;
