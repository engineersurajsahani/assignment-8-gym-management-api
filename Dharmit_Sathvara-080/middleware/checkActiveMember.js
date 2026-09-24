const checkActiveMember = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Authentication required' });

  if (user.membershipStatus === 'frozen') {
    return res.status(400).json({ message: 'Membership is frozen' });
  }

  if (new Date(user.membershipExpiryDate) < new Date()) {
    return res.status(400).json({ message: 'Membership expired' });
  }

  if (user.membershipStatus !== 'active') {
    return res.status(400).json({ message: 'Membership is not active' });
  }

  next();
};

module.exports = checkActiveMember;
