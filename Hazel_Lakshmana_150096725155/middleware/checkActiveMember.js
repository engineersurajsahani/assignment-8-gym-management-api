const checkActiveMember = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.membershipStatus === 'frozen') {
    return res.status(400).json({ message: 'Membership is frozen' });
  }

  if (new Date(req.user.membershipExpiryDate) < new Date()) {
    if (req.user.membershipStatus !== 'expired') {
      req.user.membershipStatus = 'expired';
      await req.user.save();
    }

    return res.status(400).json({ message: 'Membership expired' });
  }

  if (req.user.membershipStatus !== 'active') {
    return res.status(400).json({ message: 'Membership is not active' });
  }

  next();
};

module.exports = checkActiveMember;
