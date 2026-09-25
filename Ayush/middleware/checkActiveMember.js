

const checkActiveMember = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: please log in' });
  }

  const isExpired =
    user.membershipStatus === 'expired' ||
    (user.membershipExpiryDate && new Date(user.membershipExpiryDate) < new Date());

  if (isExpired) {
    return res.status(400).json({
      success: false,
      message: 'Your membership has expired. Please renew to continue.',
    });
  }

  if (user.membershipStatus === 'frozen') {
    return res.status(400).json({
      success: false,
      message: 'Your membership is currently frozen.',
    });
  }

  next();
};

module.exports = checkActiveMember;
