const User = require('../models/User');

// Renew / extend membership
exports.renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier } = req.body;

    if (!additionalMonths || additionalMonths <= 0) {
      return res.status(400).json({ message: 'additionalMonths must be a positive number' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Calculate new expiry date from current expiry or now, whichever is later
    const baseDate = new Date() > new Date(user.membershipExpiryDate) 
      ? new Date() 
      : new Date(user.membershipExpiryDate);
    
    baseDate.setMonth(baseDate.getMonth() + additionalMonths);
    user.membershipExpiryDate = baseDate;

    // Update tier if provided
    if (tier) {
      const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({ message: `Invalid tier. Must be one of: ${validTiers.join(', ')}` });
      }
      user.membershipTier = tier;
    }

    // Set status to active since we're renewing
    user.membershipStatus = 'active';

    await user.save();

    res.json({
      message: 'Membership renewed successfully',
      membershipTier: user.membershipTier,
      membershipStatus: user.membershipStatus,
      membershipExpiryDate: user.membershipExpiryDate,
      remainingDays: Math.ceil((user.membershipExpiryDate - new Date()) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all expired memberships
exports.getExpiredMembers = async (req, res) => {
  try {
    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: new Date() },
      membershipStatus: { $ne: 'frozen' }
    }).select('-password');

    res.json({
      count: expiredMembers.length,
      members: expiredMembers.map(m => ({
        ...m.toObject(),
        daysExpired: Math.ceil((new Date() - m.membershipExpiryDate) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get member by ID (admin use)
exports.getMemberById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
