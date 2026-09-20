const checkActiveMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  const now = new Date();

  if (
    req.user.membershipStatus !== 'active' ||
    new Date(req.user.membershipExpiryDate) < now
  ) {
    return res.status(403).json({
      message: 'Membership is expired or inactive'
    });
  }

  next();
};

module.exports = checkActiveMember;