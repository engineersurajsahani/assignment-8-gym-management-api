const User = require('../models/User');

exports.renewMembership = async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;
    
    if (!additionalMonths) {
      return res.status(400).json({ message: 'Please provide additionalMonths' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });
    
    const now = new Date();
    // If expired, start renewal from today, else extend existing expiry
    const startDate = user.membershipExpiryDate > now ? user.membershipExpiryDate : now;
    
    startDate.setMonth(startDate.getMonth() + Number(additionalMonths));
    user.membershipExpiryDate = startDate;
    user.membershipStatus = 'active';
    
    if (tier) {
      user.membershipTier = tier;
    }
    
    await user.save();
    res.json({ message: 'Membership renewed successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExpiredMembers = async (req, res) => {
  try {
    const now = new Date();
    const expiredUsers = await User.find({ membershipExpiryDate: { $lt: now } }).select('-password');
    
    // Optional: update their status to expired in db
    await User.updateMany(
      { membershipExpiryDate: { $lt: now }, membershipStatus: 'active' },
      { $set: { membershipStatus: 'expired' } }
    );

    res.json(expiredUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
