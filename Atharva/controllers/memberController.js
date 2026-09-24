const User = require('../models/User');

exports.renewMembership = async (req, res) => {
  try {
    const userId = req.params.id;
    const { additionalMonths, tier } = req.body;

    if (!additionalMonths) {
      return res.status(400).json({ success: false, message: 'Please provide additionalMonths' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentExpiry = new Date(user.membershipExpiryDate);
    const now = new Date();

    // If already expired, start renewal from today
    let newExpiry = currentExpiry < now ? now : currentExpiry;
    newExpiry.setMonth(newExpiry.getMonth() + parseInt(additionalMonths));

    user.membershipExpiryDate = newExpiry;
    
    if (tier) {
      user.membershipTier = tier;
    }

    // Save will trigger the pre-save hook and update membershipStatus
    await user.save();

    res.status(200).json({ success: true, message: 'Membership renewed', newExpiryDate: user.membershipExpiryDate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpiredMemberships = async (req, res) => {
  try {
    // Find users whose membershipExpiryDate is in the past, or status is expired
    const expiredUsers = await User.find({
      $or: [
        { membershipExpiryDate: { $lt: new Date() } },
        { membershipStatus: 'expired' }
      ]
    }).select('-password');

    res.status(200).json({ success: true, count: expiredUsers.length, data: expiredUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
