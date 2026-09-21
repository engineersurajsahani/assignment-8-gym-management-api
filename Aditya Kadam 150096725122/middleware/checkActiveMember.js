const checkActiveMember = async (req, res, next) => {
  try {
    const user = req.user;
    user.checkAndUpdateExpiry();
    await user.save();
    
    if (user.membershipStatus !== 'active') {
      return res.status(403).json({ 
        error: 'Membership not active', 
        status: user.membershipStatus,
        message: 'Please renew your membership to book classes'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking membership status' });
  }
};

module.exports = { checkActiveMember };
