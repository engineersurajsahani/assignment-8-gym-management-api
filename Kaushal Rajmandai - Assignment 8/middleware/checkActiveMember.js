const checkActiveMember = (req, res, next) => {
  const user = req.user;

  if (user.membershipExpiryDate < new Date()) {
    user.membershipStatus = 'expired';
    user.save();
    return res.status(400).json({ message: 'Membership expired. Please renew to continue.' });
  }

  next();
};

module.exports = { checkActiveMember };