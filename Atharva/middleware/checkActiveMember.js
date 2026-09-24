const checkActiveMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  // Check if expired
  if (req.user.membershipExpiryDate && new Date(req.user.membershipExpiryDate) < new Date()) {
    // Optionally update status to expired in db here if not already done, 
    // but our pre-save hook handles it on save. 
    // Here we just block access.
    return res.status(400).json({ success: false, message: 'Membership Expired. Please renew.' });
  }
  
  if (req.user.membershipStatus === 'expired') {
    return res.status(400).json({ success: false, message: 'Membership Expired. Please renew.' });
  }

  next();
};

module.exports = checkActiveMember;
