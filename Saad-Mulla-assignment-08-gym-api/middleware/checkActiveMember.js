const checkActiveMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  const now = new Date();
  if (req.user.membershipExpiryDate && new Date(req.user.membershipExpiryDate) < now) {
    return res.status(403).json({ error: 'Membership expired. Please renew to book classes.' });
  }
  next();
};

module.exports = checkActiveMember;