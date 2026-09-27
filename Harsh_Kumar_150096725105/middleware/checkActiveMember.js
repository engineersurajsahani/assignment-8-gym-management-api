module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const now = new Date();
  if (req.user.membershipExpiryDate < now) {
    return res.status(400).json({ message: 'Membership Expired' });
  }
  
  next();
};
